-- Migration 010: Alarm-triggered timed capture (UP)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT;

UPDATE public.user_profiles
SET timezone = COALESCE(NULLIF(timezone, ''), NULLIF(wake_timezone, ''), 'UTC')
WHERE timezone IS NULL OR timezone = '';

ALTER TABLE public.user_profiles
  ALTER COLUMN timezone SET DEFAULT 'UTC';

CREATE TABLE IF NOT EXISTS public.alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alarm_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  snooze_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alarms_days_valid CHECK (
    array_length(days_of_week, 1) >= 1
    AND days_of_week <@ ARRAY[1,2,3,4,5,6,7]::INTEGER[]
  ),
  CONSTRAINT alarms_snooze_valid CHECK (snooze_seconds IN (0, 60, 120))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alarms_user_id_unique ON public.alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_enabled_time ON public.alarms(enabled, alarm_time);

CREATE TABLE IF NOT EXISTS public.entry_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_date DATE NOT NULL,
  window_opened_at TIMESTAMPTZ NOT NULL,
  window_expires_at TIMESTAMPTZ NOT NULL,
  entry_started BOOLEAN NOT NULL DEFAULT FALSE,
  entry_id UUID REFERENCES public.dreams(id),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT entry_windows_unique_user_day UNIQUE (user_id, window_date),
  CONSTRAINT entry_windows_window_order CHECK (window_expires_at > window_opened_at)
);

CREATE INDEX IF NOT EXISTS idx_entry_windows_user_date ON public.entry_windows(user_id, window_date DESC);
CREATE INDEX IF NOT EXISTS idx_entry_windows_user_locked ON public.entry_windows(user_id, locked);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_endpoint
  ON public.push_subscriptions (user_id, ((subscription ->> 'endpoint')));

DROP TRIGGER IF EXISTS trg_alarms_updated_at ON public.alarms;
CREATE TRIGGER trg_alarms_updated_at
  BEFORE UPDATE ON public.alarms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alarms: select own" ON public.alarms;
CREATE POLICY "alarms: select own"
  ON public.alarms
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alarms: insert own" ON public.alarms;
CREATE POLICY "alarms: insert own"
  ON public.alarms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alarms: update own" ON public.alarms;
CREATE POLICY "alarms: update own"
  ON public.alarms
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alarms: delete own" ON public.alarms;
CREATE POLICY "alarms: delete own"
  ON public.alarms
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_windows: select own" ON public.entry_windows;
CREATE POLICY "entry_windows: select own"
  ON public.entry_windows
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_windows: insert own" ON public.entry_windows;
CREATE POLICY "entry_windows: insert own"
  ON public.entry_windows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_windows: update own" ON public.entry_windows;
CREATE POLICY "entry_windows: update own"
  ON public.entry_windows
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions: select own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: select own"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions: insert own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: insert own"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions: update own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: update own"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions: delete own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: delete own"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, wake_time, wake_timezone, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'wake_time', '')::TIME,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC'),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'timezone', ''), NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    wake_time = COALESCE(user_profiles.wake_time, NULLIF(NEW.raw_user_meta_data ->> 'wake_time', '')::TIME),
    wake_timezone = COALESCE(NULLIF(user_profiles.wake_timezone, ''), COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC')),
    timezone = COALESCE(NULLIF(user_profiles.timezone, ''), COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'timezone', ''), NULLIF(NEW.raw_user_meta_data ->> 'wake_timezone', ''), 'UTC'));

  RETURN NEW;
END;
$$;
