-- We keep these (auth still needed):
-- auth.users
-- profiles

-- We no longer need these:
DROP TABLE IF EXISTS dream_seeds CASCADE;
DROP TABLE IF EXISTS dreams CASCADE;
DROP TABLE IF EXISTS notebooks CASCADE;
DROP TABLE IF EXISTS dream_notebooks CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS dream_tags CASCADE;
DROP TABLE IF EXISTS wake_logs CASCADE;
