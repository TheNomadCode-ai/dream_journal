import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import type { Metadata } from 'next'

import DashboardSetupFlow from '@/components/dashboard/DashboardSetupFlow'
import DreamCycleDashboard from '@/components/dashboard/DreamCycleDashboard'
import { dateKeyLocal } from '@/lib/dream-cycle'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardPage() {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const today = dateKeyLocal(0)
  const yesterday = dateKeyLocal(-1)

  const [todaySeedResult, yesterdaySeedResult, recentSeedsResult, dreamsResult] = await Promise.all([
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, morning_entry_written, dream_entry_id')
      .eq('user_id', user.id)
      .eq('seed_date', today)
      .maybeSingle(),
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, morning_entry_written, dream_entry_id')
      .eq('user_id', user.id)
      .eq('seed_date', yesterday)
      .maybeSingle(),
    supabase
      .from('dream_seeds')
      .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, morning_entry_written, dream_entry_id')
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
        .select('dream_entry_id, seed_text, was_dreamed, morning_entry_written')
        .eq('user_id', user.id)
        .in('dream_entry_id', dreamIds)
    ).data ?? []
    : []

  const isTrialUser = profile?.tier === 'free' && Boolean(profile?.trial_ends_at) && new Date(profile?.trial_ends_at ?? '') > new Date()
  const trialDaysRemaining = isTrialUser
    ? Math.max(1, Math.ceil((new Date(profile?.trial_ends_at ?? '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const showNotificationReminderBanner = profile?.notification_permission_granted === false
  const wakeTime = profile?.target_wake_time ?? '07:00:00'
  const sleepTime = profile?.target_sleep_time ?? '23:00:00'
  const totalSeedsPlanted = profile?.total_seeds_planted ?? 0
  const totalSeedsDreamed = profile?.total_seeds_dreamed ?? 0

  return (
    <div className="page-content">
      {trialDaysRemaining > 0 ? (
        <section style={{ background: 'rgba(20,10,40,0.95)', borderBottom: '1px solid rgba(200,160,80,0.15)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12 }}>Pro trial - {trialDaysRemaining} days remaining</p>
          <a href="https://sushankhanal.gumroad.com/l/somniavault?wanted=true" target="_blank" rel="noreferrer" style={{ padding: '6px 10px', border: '1px solid rgba(200,160,80,0.5)', borderRadius: 4, color: 'rgba(200,160,80,0.9)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {'Upgrade ->'}
          </a>
        </section>
      ) : null}
      <DashboardSetupFlow userId={user.id} initialWakeTime={profile?.target_wake_time ?? null} initialSleepTime={profile?.target_sleep_time ?? null} />
      <DreamCycleDashboard
        wakeTime={wakeTime}
        sleepTime={sleepTime}
        todaySeed={todaySeedResult.data as any}
        yesterdaySeed={yesterdaySeedResult.data as any}
        recentSeeds={(recentSeedsResult.data ?? []) as any}
        dreams={dreams as any}
        archiveSeeds={archiveSeeds as any}
        totalSeedsPlanted={totalSeedsPlanted}
        totalSeedsDreamed={totalSeedsDreamed}
        showNotificationReminderBanner={showNotificationReminderBanner}
      />
    </div>
  )
}
