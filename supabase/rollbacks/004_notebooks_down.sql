-- Migration 004: Notebooks (DOWN)

-- Drop RLS policies
DROP POLICY IF EXISTS "dream_notebooks: delete via notebook ownership" ON public.dream_notebooks;
DROP POLICY IF EXISTS "dream_notebooks: insert via notebook ownership" ON public.dream_notebooks;
DROP POLICY IF EXISTS "dream_notebooks: select via notebook ownership" ON public.dream_notebooks;
ALTER TABLE public.dream_notebooks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notebooks: delete own"  ON public.notebooks;
DROP POLICY IF EXISTS "notebooks: update own"  ON public.notebooks;
DROP POLICY IF EXISTS "notebooks: insert own"  ON public.notebooks;
DROP POLICY IF EXISTS "notebooks: select own"  ON public.notebooks;
ALTER TABLE public.notebooks DISABLE ROW LEVEL SECURITY;

-- Drop trigger
DROP TRIGGER IF EXISTS trg_notebooks_updated_at ON public.notebooks;

-- Drop tables
DROP TABLE IF EXISTS public.dream_notebooks;
DROP TABLE IF EXISTS public.notebooks;
