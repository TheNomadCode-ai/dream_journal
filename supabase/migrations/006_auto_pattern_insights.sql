-- Migration 006: Automatic Pattern Insights (UP)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS auto_pattern_insight TEXT,
  ADD COLUMN IF NOT EXISTS auto_pattern_generated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.refresh_user_pattern_insight(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER := 0;
  v_week_total INTEGER := 0;
  v_water_count INTEGER := 0;
  v_anxiety_count INTEGER := 0;
  v_anxiety_percent INTEGER := 0;
  v_top_mood SMALLINT;
  v_top_mood_count INTEGER := 0;
  v_insight TEXT;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_total
  FROM public.dreams d
  WHERE d.user_id = p_user_id
    AND d.deleted_at IS NULL;

  IF v_total < 5 THEN
    UPDATE public.user_profiles
    SET
      auto_pattern_insight = NULL,
      auto_pattern_generated_at = NULL,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_water_count
  FROM public.dreams d
  WHERE d.user_id = p_user_id
    AND d.deleted_at IS NULL
    AND d.date_of_dream >= date_trunc('month', CURRENT_DATE)::DATE
    AND lower(COALESCE(d.title, '') || ' ' || COALESCE(d.body_text, '')) ~ '\\m(water|ocean|river|lake|rain|sea|waves?)\\M';

  IF v_water_count >= 2 THEN
    v_insight := format('You''ve mentioned water in %s dreams this month.', v_water_count);
  ELSE
    SELECT
      COUNT(*)::INTEGER,
      COUNT(*) FILTER (
        WHERE lower(COALESCE(d.title, '') || ' ' || COALESCE(d.body_text, '')) ~ '\\m(anxiety|anxious|stress|panic|fear|afraid)\\M'
      )::INTEGER
    INTO v_week_total, v_anxiety_count
    FROM public.dreams d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND d.date_of_dream >= (CURRENT_DATE - INTERVAL '6 days')::DATE;

    IF v_week_total > 0 AND v_anxiety_count > 0 THEN
      v_anxiety_percent := ROUND((v_anxiety_count::NUMERIC / v_week_total::NUMERIC) * 100)::INTEGER;
      v_insight := format('Anxiety appeared in %s%% of your entries this week.', v_anxiety_percent);
    ELSE
      SELECT mood_score, COUNT(*)::INTEGER
      INTO v_top_mood, v_top_mood_count
      FROM public.dreams d
      WHERE d.user_id = p_user_id
        AND d.deleted_at IS NULL
        AND d.mood_score IS NOT NULL
        AND d.date_of_dream >= date_trunc('month', CURRENT_DATE)::DATE
      GROUP BY mood_score
      ORDER BY COUNT(*) DESC, mood_score DESC
      LIMIT 1;

      IF v_top_mood IS NOT NULL THEN
        v_insight := CASE v_top_mood
          WHEN 1 THEN format('Restless themes led %s dreams this month.', v_top_mood_count)
          WHEN 2 THEN format('Melancholy tones appeared in %s dreams this month.', v_top_mood_count)
          WHEN 3 THEN format('Neutral moods anchored %s dreams this month.', v_top_mood_count)
          WHEN 4 THEN format('Peaceful moods appeared in %s dreams this month.', v_top_mood_count)
          WHEN 5 THEN format('Luminous moments showed up in %s dreams this month.', v_top_mood_count)
          ELSE NULL
        END;
      END IF;
    END IF;
  END IF;

  IF v_insight IS NULL THEN
    v_insight := format('You''ve captured %s dreams so far. Patterns are beginning to emerge.', v_total);
  END IF;

  UPDATE public.user_profiles
  SET
    auto_pattern_insight = v_insight,
    auto_pattern_generated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.refresh_user_pattern_insight(UUID) IS
  'Generates one automatic pattern insight for users with at least 5 dream entries';

CREATE OR REPLACE FUNCTION public.sync_user_streak_on_dream_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  PERFORM public.refresh_user_streak(v_user_id);
  PERFORM public.refresh_user_pattern_insight(v_user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  FOR v_user_id IN SELECT id FROM public.user_profiles LOOP
    PERFORM public.refresh_user_pattern_insight(v_user_id);
  END LOOP;
END;
$$;
