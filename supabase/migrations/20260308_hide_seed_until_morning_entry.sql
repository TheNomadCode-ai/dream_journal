ALTER TABLE public.dream_seeds
  ADD COLUMN IF NOT EXISTS morning_entry_written BOOLEAN DEFAULT FALSE;

UPDATE public.dream_seeds
SET morning_entry_written = TRUE
WHERE morning_entry_written IS DISTINCT FROM TRUE
  AND (dream_entry_id IS NOT NULL OR morning_confirmed_at IS NOT NULL);
