import { redirect } from 'next/navigation'

import SleepPlanSettings from '@/components/settings/SleepPlanSettings'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_wake_time, target_sleep_time, tier')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 120px' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, color: '#9e8bbc', marginBottom: 10 }}>Settings</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(34px,4vw,44px)', color: '#e8e4d9' }}>
          Sleep schedule and plan
        </h1>
      </header>

      <SleepPlanSettings
        initialWakeTime={profile?.target_wake_time ?? '07:00:00'}
        initialSleepTime={profile?.target_sleep_time ?? '23:00:00'}
        tier={profile?.tier ?? 'free'}
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
