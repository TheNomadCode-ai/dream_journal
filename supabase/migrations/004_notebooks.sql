-- Migration 004: Notebooks (UP)

-- ─── Notebooks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notebooks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT        CHECK (char_length(description) <= 500),
  color       TEXT        CHECK (color ~ '^#[0-9a-fA-F]{6}$'),  -- Optional HEX colour
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_notebooks_user_id ON public.notebooks (user_id);

COMMENT ON TABLE public.notebooks IS 'User-created collections for organising dreams';
COMMENT ON COLUMN public.notebooks.color IS 'Optional HEX colour code for visual distinction';

-- ─── Dream Notebooks (Join Table) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dream_notebooks (
  dream_id    UUID NOT NULL REFERENCES public.dreams(id)    ON DELETE CASCADE,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dream_id, notebook_id)
);

CREATE INDEX idx_dream_notebooks_notebook_id ON public.dream_notebooks (notebook_id);
CREATE INDEX idx_dream_notebooks_dream_id    ON public.dream_notebooks (dream_id);

COMMENT ON TABLE public.dream_notebooks IS 'Many-to-many join: dreams belong to notebooks';

-- ─── updated_at trigger for notebooks ────────────────────────────────────────
CREATE TRIGGER trg_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS for notebooks ────────────────────────────────────────────────────────
ALTER TABLE public.notebooks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notebooks: select own"
  ON public.notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notebooks: insert own"
  ON public.notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notebooks: update own"
  ON public.notebooks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notebooks: delete own"
  ON public.notebooks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "dream_notebooks: select via notebook ownership"
  ON public.dream_notebooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notebooks n
      WHERE n.id = notebook_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "dream_notebooks: insert via notebook ownership"
  ON public.dream_notebooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notebooks n
      WHERE n.id = notebook_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "dream_notebooks: delete via notebook ownership"
  ON public.dream_notebooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.notebooks n
      WHERE n.id = notebook_id AND n.user_id = auth.uid()
    )
  );
