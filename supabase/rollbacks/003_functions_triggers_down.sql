-- Migration 003: Functions & Triggers (DOWN)

-- Drop trigger on auth.users (must be dropped before the function)
DROP TRIGGER IF EXISTS trg_auth_users_on_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop search function
DROP FUNCTION IF EXISTS public.search_dreams(uuid, text, int, int);

-- Drop body_text sync
DROP TRIGGER IF EXISTS trg_dreams_sync_body_text ON public.dreams;
DROP FUNCTION IF EXISTS public.sync_body_text();

-- Drop helper
DROP FUNCTION IF EXISTS public.jsonb_to_text(jsonb);

-- Drop updated_at triggers
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_dreams_updated_at ON public.dreams;
DROP FUNCTION IF EXISTS public.set_updated_at();
