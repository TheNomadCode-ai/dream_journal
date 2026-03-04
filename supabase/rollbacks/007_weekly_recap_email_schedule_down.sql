-- Rollback 007: Weekly Dream Recap Email Schedule (DOWN)

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'weekly-dream-recap-email';
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;
