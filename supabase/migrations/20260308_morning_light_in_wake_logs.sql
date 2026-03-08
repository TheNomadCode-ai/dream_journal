alter table public.wake_logs
add column if not exists morning_light integer;

alter table public.wake_logs
drop constraint if exists wake_logs_morning_light_check;

alter table public.wake_logs
add constraint wake_logs_morning_light_check
check (morning_light is null or (morning_light >= 0 and morning_light <= 180));
