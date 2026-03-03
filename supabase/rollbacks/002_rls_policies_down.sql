-- Migration 002: Row Level Security (DOWN)
-- Drops all RLS policies and disables RLS

-- dream_tags
DROP POLICY IF EXISTS "dream_tags: delete via dream ownership" ON public.dream_tags;
DROP POLICY IF EXISTS "dream_tags: insert via dream ownership" ON public.dream_tags;
DROP POLICY IF EXISTS "dream_tags: select via dream ownership" ON public.dream_tags;
ALTER TABLE public.dream_tags DISABLE ROW LEVEL SECURITY;

-- dreams
DROP POLICY IF EXISTS "dreams: delete own" ON public.dreams;
DROP POLICY IF EXISTS "dreams: update own" ON public.dreams;
DROP POLICY IF EXISTS "dreams: insert own" ON public.dreams;
DROP POLICY IF EXISTS "dreams: select own" ON public.dreams;
ALTER TABLE public.dreams DISABLE ROW LEVEL SECURITY;

-- tags
DROP POLICY IF EXISTS "tags: delete own" ON public.tags;
DROP POLICY IF EXISTS "tags: update own" ON public.tags;
DROP POLICY IF EXISTS "tags: insert own" ON public.tags;
DROP POLICY IF EXISTS "tags: select own" ON public.tags;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;

-- user_profiles
DROP POLICY IF EXISTS "users: update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users: insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users: select own profile" ON public.user_profiles;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
