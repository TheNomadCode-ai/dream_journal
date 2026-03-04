-- Migration 005: User Profile Streak Tracking (UP)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_logged_date DATE,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0);

CREATE OR REPLACE FUNCTION public.refresh_user_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_logged DATE;
  v_streak INTEGER := 0;
BEGIN
  WITH distinct_days AS (
    SELECT DISTINCT d.date_of_dream::DATE AS day
    FROM public.dreams d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
  ),
  ordered AS (
    SELECT
      day,
      row_number() OVER (ORDER BY day DESC) AS rn,
      max(day) OVER () AS max_day
    FROM distinct_days
  )
  SELECT
    max(max_day),
    COALESCE(COUNT(*) FILTER (WHERE day = (max_day - (rn - 1))), 0)::INTEGER
  INTO v_last_logged, v_streak
  FROM ordered;

  UPDATE public.user_profiles
  SET
    last_logged_date = v_last_logged,
    current_streak = COALESCE(v_streak, 0),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.refresh_user_streak(UUID) IS
  'Recomputes the user''s current consecutive dream streak and last logged date';

CREATE OR REPLACE FUNCTION public.sync_user_streak_on_dream_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_user_streak(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_dreams_sync_user_streak ON public.dreams;

CREATE TRIGGER trg_dreams_sync_user_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_streak_on_dream_change();

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  FOR v_user_id IN SELECT id FROM public.user_profiles LOOP
    PERFORM public.refresh_user_streak(v_user_id);
  END LOOP;
END;
$$;
