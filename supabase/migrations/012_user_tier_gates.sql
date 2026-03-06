-- Migration 012: User tier support for feature gating

-- Add tier to user_profiles (primary table in this codebase)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS tier TEXT
DEFAULT 'free'
CHECK (tier IN ('free', 'pro', 'lifetime'));

-- Backfill tier from existing plan values
UPDATE public.user_profiles
SET tier = COALESCE(tier, plan, 'free');

-- Keep legacy profiles table compatible when it exists
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE '
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS tier TEXT
      DEFAULT ''free''
      CHECK (tier IN (''free'', ''pro'', ''lifetime''))
    ';

    EXECUTE '
      UPDATE public.profiles
      SET tier = COALESCE(tier, ''free'')
    ';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_tier TEXT;
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    SELECT COALESCE(tier, plan, 'free')
    INTO resolved_tier
    FROM public.user_profiles
    WHERE id = user_id;

    IF resolved_tier IS NOT NULL THEN
      RETURN resolved_tier;
    END IF;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'SELECT COALESCE(tier, ''free'') FROM public.profiles WHERE id = $1'
    INTO resolved_tier
    USING user_id;

    IF resolved_tier IS NOT NULL THEN
      RETURN resolved_tier;
    END IF;
  END IF;

  RETURN 'free';
END;
$$;
