-- Migration 011: Notebook cover color alignment

ALTER TABLE IF EXISTS public.notebooks
  ADD COLUMN IF NOT EXISTS cover_color TEXT DEFAULT '4F46E5';

UPDATE public.notebooks
SET cover_color = regexp_replace(COALESCE(color, '4F46E5'), '^#', '')
WHERE cover_color IS NULL;

ALTER TABLE public.notebooks
  ALTER COLUMN cover_color SET DEFAULT '4F46E5';

ALTER TABLE public.notebooks
  ALTER COLUMN cover_color SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notebooks'
      AND column_name = 'color'
  ) THEN
    ALTER TABLE public.notebooks DROP COLUMN color;
  END IF;
END $$;
