ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS streak_freezes_remaining INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_freezes_reset_date DATE;

ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS streak_freezes_remaining INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_freezes_reset_date DATE;
