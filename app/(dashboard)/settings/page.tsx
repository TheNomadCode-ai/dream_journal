import { redirect } from 'next/navigation'

import SleepPlanSettings from '@/components/settings/SleepPlanSettings'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/tier'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_wake_time, target_sleep_time, tier, trial_ends_at')
    .eq('id', user.id)
    .maybeSingle()

  const effectiveTier = await getUserTier(user.id)
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrial = profile?.tier === 'free' && effectiveTier === 'pro' && Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now())
  const trialDaysRemaining = isTrial && trialEndsAt
    ? Math.max(1, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="page-content page-enter" style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 120px' }}>
      <SleepPlanSettings
        initialWakeTime={profile?.target_wake_time ?? '07:00:00'}
        initialSleepTime={profile?.target_sleep_time ?? '23:00:00'}
        tier={effectiveTier}
        isTrial={isTrial}
        trialDaysRemaining={trialDaysRemaining}
      />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '34px 0 16px' }} />
      <p style={{ color: '#9e8bbc', fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
        Somnia is built by one person.
        <br />
        If something is broken, missing,
        <br />
        or you just want to share a dream -
        <br />
        I read every message.
      </p>
      <a
        href="https://twitter.com/messages/compose?recipient_id=sirberialo007"
        target="_blank"
        rel="noreferrer"
        style={{ color: '#c9a84c' }}
      >
        {'Message the founder ->'}
      </a>
    </div>
  )
}
