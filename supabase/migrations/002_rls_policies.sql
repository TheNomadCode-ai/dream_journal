-- Migration 002: Row Level Security (UP)
-- Enables RLS and creates policies so users can only access their own data

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_tags    ENABLE ROW LEVEL SECURITY;

-- ─── user_profiles policies ───────────────────────────────────────────────────
CREATE POLICY "users: select own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles are never hard-deleted via API (only via auth.users cascade)

-- ─── tags policies ────────────────────────────────────────────────────────────
CREATE POLICY "tags: select own"
  ON public.tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tags: insert own"
  ON public.tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags: update own"
  ON public.tags
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags: delete own"
  ON public.tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── dreams policies ──────────────────────────────────────────────────────────
CREATE POLICY "dreams: select own"
  ON public.dreams
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dreams: insert own"
  ON public.dreams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dreams: update own"
  ON public.dreams
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dreams: delete own"
  ON public.dreams
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── dream_tags policies ──────────────────────────────────────────────────────
-- dream_tags are only accessible if the user owns the parent dream
CREATE POLICY "dream_tags: select via dream ownership"
  ON public.dream_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dreams d
      WHERE d.id = dream_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "dream_tags: insert via dream ownership"
  ON public.dream_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dreams d
      WHERE d.id = dream_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "dream_tags: delete via dream ownership"
  ON public.dream_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dreams d
      WHERE d.id = dream_id AND d.user_id = auth.uid()
    )
  );

-- ─── Service role bypass note ─────────────────────────────────────────────────
-- The service_role key bypasses RLS automatically in Postgres.
-- Never expose the service_role key to the client.
