import { redirect } from 'next/navigation'

import SleepPlanSettings from '@/components/settings/SleepPlanSettings'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, dreamsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('target_wake_time, target_sleep_time, tier')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('dreams')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null),
  ])

  const profile = profileResult.data

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
        freeEntriesUsed={dreamsResult.count ?? 0}
      />
    </div>
  )
}
