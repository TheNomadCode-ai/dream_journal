-- Dream incubation core: daily seed loop + profile counters
CREATE TABLE IF NOT EXISTS public.dream_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_text TEXT NOT NULL,
  seed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  was_dreamed BOOLEAN DEFAULT NULL,
  dream_entry_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
  evening_window_opened_at TIMESTAMPTZ,
  evening_window_expires_at TIMESTAMPTZ,
  morning_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seed_date)
);

ALTER TABLE public.dream_seeds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dream_seeds'
      AND policyname = 'Users can read own seeds'
  ) THEN
    CREATE POLICY "Users can read own seeds"
      ON public.dream_seeds
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dream_seeds'
      AND policyname = 'Users can insert own seeds'
  ) THEN
    CREATE POLICY "Users can insert own seeds"
      ON public.dream_seeds
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dream_seeds'
      AND policyname = 'Users can update own seeds'
  ) THEN
    CREATE POLICY "Users can update own seeds"
      ON public.dream_seeds
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_wake_time TIME DEFAULT '07:00:00',
  ADD COLUMN IF NOT EXISTS target_sleep_time TIME DEFAULT '23:00:00',
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS last_seed_date DATE,
  ADD COLUMN IF NOT EXISTS total_seeds_planted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seeds_dreamed INTEGER DEFAULT 0;
