-- Migration 003: Functions & Triggers (UP)

-- ─── updated_at auto-update trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Automatically sets updated_at to NOW() on row update';

-- Attach to dreams table
CREATE TRIGGER trg_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attach to user_profiles table
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── jsonb_to_text helper ─────────────────────────────────────────────────────
-- Extracts concatenated plain text from Tiptap JSON document.
-- Tiptap JSON structure: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "..." }] }] }
CREATE OR REPLACE FUNCTION public.jsonb_to_text(doc JSONB)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT string_agg(leaf ->> 'text', ' ')
  FROM jsonb_path_query(doc, '$.**.text') AS leaf
  WHERE jsonb_typeof(leaf) = 'string';
$$;

COMMENT ON FUNCTION public.jsonb_to_text(jsonb) IS
  'Extracts all text nodes from a Tiptap/ProseMirror JSON document';

-- ─── body_text auto-update trigger ────────────────────────────────────────────
-- Keeps body_text in sync with body_json so search_vec stays up to date.
CREATE OR REPLACE FUNCTION public.sync_body_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.body_json IS DISTINCT FROM OLD.body_json THEN
    NEW.body_text = public.jsonb_to_text(NEW.body_json);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dreams_sync_body_text
  BEFORE INSERT OR UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.sync_body_text();

-- ─── search_dreams RPC function ───────────────────────────────────────────────
-- Used by GET /api/dreams/search to perform full-text search with ranking
-- and highlighted snippets.
CREATE OR REPLACE FUNCTION public.search_dreams(
  p_user_id UUID,
  p_query   TEXT,
  p_limit   INT  DEFAULT 20,
  p_offset  INT  DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  user_id       UUID,
  title         TEXT,
  body_json     JSONB,
  body_text     TEXT,
  mood_score    SMALLINT,
  lucid         BOOLEAN,
  date_of_dream DATE,
  search_vec    TSVECTOR,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  headline      TEXT,
  rank          FLOAT4,
  total_count   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TSQUERY;
BEGIN
  -- Build tsquery: try websearch format first (handles phrases, +/- operators)
  -- Fall back to plainto_tsquery for plain natural language input
  BEGIN
    v_query := websearch_to_tsquery('english', p_query);
  EXCEPTION WHEN OTHERS THEN
    v_query := plainto_tsquery('english', p_query);
  END;

  RETURN QUERY
  SELECT
    d.id,
    d.user_id,
    d.title,
    d.body_json,
    d.body_text,
    d.mood_score,
    d.lucid,
    d.date_of_dream,
    d.search_vec,
    d.created_at,
    d.updated_at,
    d.deleted_at,
    ts_headline(
      'english',
      COALESCE(d.body_text, ''),
      v_query,
      'MaxFragments=2, MaxWords=30, MinWords=10, StartSel=<mark>, StopSel=</mark>'
    ) AS headline,
    ts_rank_cd(d.search_vec, v_query, 32)::FLOAT4 AS rank,
    COUNT(*) OVER ()::BIGINT AS total_count
  FROM public.dreams d
  WHERE
    d.user_id = p_user_id
    AND d.deleted_at IS NULL
    AND d.search_vec @@ v_query
  ORDER BY rank DESC, d.date_of_dream DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.search_dreams(uuid, text, int, int) IS
  'Full-text dream search with ts_headline snippets and pagination';

-- ─── New user profile trigger ─────────────────────────────────────────────────
-- Auto-creates a user_profiles row when a new auth.users row is inserted.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_users_on_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
