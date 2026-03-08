alter table public.profiles
  add column if not exists trial_started_at timestamptz default now(),
  add column if not exists trial_ends_at timestamptz default (now() + interval '7 days'),
  add column if not exists notification_permission_granted boolean default false;

update public.profiles
set trial_started_at = coalesce(trial_started_at, created_at, now()),
    trial_ends_at = coalesce(trial_ends_at, coalesce(created_at, now()) + interval '7 days'),
    notification_permission_granted = coalesce(notification_permission_granted, false)
where trial_started_at is null
   or trial_ends_at is null
   or notification_permission_granted is null;
