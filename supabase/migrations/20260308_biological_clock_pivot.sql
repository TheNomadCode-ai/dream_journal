-- Drop old tables
DROP TABLE IF EXISTS entry_windows;
DROP TABLE IF EXISTS alarms;
DROP TABLE IF EXISTS push_subscriptions;

-- Update profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS target_wake_time TIME DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS target_sleep_time TIME DEFAULT '23:00:00',
ADD COLUMN IF NOT EXISTS chronotype TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS home_screen_installed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Create wake_logs table
CREATE TABLE IF NOT EXISTS wake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  actual_wake_time TIME NOT NULL,
  actual_sleep_time TIME,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  minutes_from_target INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- RLS for wake_logs
ALTER TABLE wake_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own wake logs" ON wake_logs;
DROP POLICY IF EXISTS "Users can insert own wake logs" ON wake_logs;
DROP POLICY IF EXISTS "Users can update own wake logs" ON wake_logs;

CREATE POLICY "Users can read own wake logs"
ON wake_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wake logs"
ON wake_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wake logs"
ON wake_logs FOR UPDATE
USING (auth.uid() = user_id);
