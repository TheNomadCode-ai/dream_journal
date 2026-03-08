import { redirect } from 'next/navigation'

import { NotificationBanner } from '@/components/NotificationBanner'
import DreamCycleDashboard from '@/components/dashboard/DreamCycleDashboard'
import { dateKeyLocal } from '@/lib/dream-cycle'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete, target_wake_time, target_sleep_time, total_seeds_planted, total_seeds_dreamed, tier, trial_ends_at, notification_permission_granted')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  const today = dateKeyLocal(0)
  const yesterday = dateKeyLocal(-1)

  const [todaySeedResult, yesterdaySeedResult, recentSeedsResult, dreamsResult] = await Promise.all([
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, dream_entry_id')
      .eq('user_id', user.id)
      .eq('seed_date', today)
      .maybeSingle(),
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, dream_entry_id')
      .eq('user_id', user.id)
      .eq('seed_date', yesterday)
      .maybeSingle(),
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, dream_entry_id')
      .eq('user_id', user.id)
      .order('seed_date', { ascending: false })
      .limit(120),
    supabase
      .from('dreams')
      .select('id, title, body_text, date_of_dream')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('date_of_dream', { ascending: false })
      .limit(30),
  ])

  const dreams = dreamsResult.data ?? []
  const dreamIds = dreams.map((dream) => dream.id)

  const archiveSeeds = dreamIds.length
    ? (
      await supabase
        .from('dream_seeds')
        .select('dream_entry_id, seed_text, was_dreamed')
        .eq('user_id', user.id)
        .in('dream_entry_id', dreamIds)
    ).data ?? []
    : []

  const isTrialUser = profile?.tier === 'free' && Boolean(profile?.trial_ends_at) && new Date(profile?.trial_ends_at ?? '') > new Date()
  const trialDaysRemaining = isTrialUser
    ? Math.max(1, Math.ceil((new Date(profile?.trial_ends_at ?? '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const showNotificationReminderBanner = profile?.notification_permission_granted === false

  return (
    <>
      <NotificationBanner />
      <DreamCycleDashboard
        wakeTime={profile.target_wake_time ?? '07:00:00'}
        sleepTime={profile.target_sleep_time ?? '23:00:00'}
        todaySeed={todaySeedResult.data as any}
        yesterdaySeed={yesterdaySeedResult.data as any}
        recentSeeds={(recentSeedsResult.data ?? []) as any}
        dreams={dreams as any}
        archiveSeeds={archiveSeeds as any}
        totalSeedsPlanted={profile.total_seeds_planted ?? 0}
        totalSeedsDreamed={profile.total_seeds_dreamed ?? 0}
        trialDaysRemaining={trialDaysRemaining}
        showNotificationReminderBanner={showNotificationReminderBanner}
      />
    </>
  )
}
