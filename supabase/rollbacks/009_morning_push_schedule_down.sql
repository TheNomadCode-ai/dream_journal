-- Rollback 009: Morning Push Schedule (DOWN)

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'morning-push-reminder';
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;
