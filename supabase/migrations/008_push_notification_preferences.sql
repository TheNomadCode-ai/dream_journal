-- Migration 008: Push Notification Preferences (UP)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS wake_time TIME,
  ADD COLUMN IF NOT EXISTS wake_timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_subscription JSONB,
  ADD COLUMN IF NOT EXISTS last_push_sent_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, wake_time, wake_timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'wake_time', '')::TIME,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    wake_time = COALESCE(user_profiles.wake_time, NULLIF(NEW.raw_user_meta_data ->> 'wake_time', '')::TIME),
    wake_timezone = COALESCE(NULLIF(user_profiles.wake_timezone, ''), COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC'));

  RETURN NEW;
END;
$$;
