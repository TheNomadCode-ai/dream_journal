-- Ensure insert/update RLS policies exist for alarms.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'alarms'
      AND policyname = 'Users can insert own alarms'
  ) THEN
    CREATE POLICY "Users can insert own alarms"
      ON public.alarms
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'alarms'
      AND policyname = 'Users can update own alarms'
  ) THEN
    CREATE POLICY "Users can update own alarms"
      ON public.alarms
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;