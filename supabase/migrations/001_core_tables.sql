-- Migration 001: Core Tables (UP)
-- Creates the foundational tables for Somnia MVP

-- ─── User Profiles ────────────────────────────────────────────────────────────
-- Extends auth.users with public profile data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 50),
  avatar_url    TEXT,
  plan          TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'lifetime')),
  stripe_customer_id TEXT   UNIQUE,
  onboarded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'Public user profile data, extends auth.users';
COMMENT ON COLUMN public.user_profiles.plan IS 'Billing plan: free | pro | lifetime';

-- ─── Tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)  -- Tags are per-user and must be unique per user
);

CREATE INDEX idx_tags_user_id ON public.tags (user_id);

COMMENT ON TABLE public.tags IS 'User-defined tags for categorising dreams';

-- ─── Dreams ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dreams (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        CHECK (char_length(title) <= 200),
  body_json      JSONB       NOT NULL DEFAULT '{"type":"doc","content":[]}',
  body_text      TEXT,                          -- Extracted plain text for search
  mood_score     SMALLINT    CHECK (mood_score BETWEEN 1 AND 5),
  lucid          BOOLEAN     NOT NULL DEFAULT FALSE,
  date_of_dream  DATE        NOT NULL,
  search_vec     TSVECTOR    GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      COALESCE(title, '') || ' ' || COALESCE(body_text, '')
    )
  ) STORED,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ                    -- Soft delete; NULL = not deleted
);

-- Indexes
CREATE INDEX idx_dreams_user_id         ON public.dreams (user_id);
CREATE INDEX idx_dreams_user_date       ON public.dreams (user_id, date_of_dream DESC);
CREATE INDEX idx_dreams_user_deleted    ON public.dreams (user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_dreams_search_vec      ON public.dreams USING GIN (search_vec);

COMMENT ON TABLE public.dreams IS 'Dream journal entries';
COMMENT ON COLUMN public.dreams.body_json IS 'Tiptap editor JSON content';
COMMENT ON COLUMN public.dreams.body_text IS 'Plain text extracted from body_json for full-text search';
COMMENT ON COLUMN public.dreams.search_vec IS 'Generated tsvector for Postgres full-text search';
COMMENT ON COLUMN public.dreams.deleted_at IS 'Soft delete timestamp; NULL means the entry is active';

-- ─── Dream Tags (Join Table) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dream_tags (
  dream_id   UUID NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (dream_id, tag_id)
);

CREATE INDEX idx_dream_tags_tag_id   ON public.dream_tags (tag_id);
CREATE INDEX idx_dream_tags_dream_id ON public.dream_tags (dream_id);

COMMENT ON TABLE public.dream_tags IS 'Many-to-many join between dreams and tags';
