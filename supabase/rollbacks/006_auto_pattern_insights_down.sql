-- Rollback 006: Automatic Pattern Insights (DOWN)

DROP FUNCTION IF EXISTS public.refresh_user_pattern_insight(UUID);

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

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS auto_pattern_generated_at,
  DROP COLUMN IF EXISTS auto_pattern_insight;
