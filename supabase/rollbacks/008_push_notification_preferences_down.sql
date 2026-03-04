-- Rollback 008: Push Notification Preferences (DOWN)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS last_push_sent_at,
  DROP COLUMN IF EXISTS push_subscription,
  DROP COLUMN IF EXISTS push_enabled,
  DROP COLUMN IF EXISTS wake_timezone,
  DROP COLUMN IF EXISTS wake_time;
