ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days';

UPDATE profiles
SET
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '7 days'
WHERE trial_started_at IS NULL;
