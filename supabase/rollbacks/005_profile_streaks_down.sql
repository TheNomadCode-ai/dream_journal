-- Rollback 005: User Profile Streak Tracking (DOWN)

DROP TRIGGER IF EXISTS trg_dreams_sync_user_streak ON public.dreams;
DROP FUNCTION IF EXISTS public.sync_user_streak_on_dream_change();
DROP FUNCTION IF EXISTS public.refresh_user_streak(UUID);

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS last_logged_date,
  DROP COLUMN IF EXISTS current_streak;
