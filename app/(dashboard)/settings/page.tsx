import { redirect } from 'next/navigation'

import WakeTargetSettings from '@/components/settings/WakeTargetSettings'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_wake_time')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 120px' }}>
      <header style={{ marginBottom: 30 }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: 10,
            color: '#9e8bbc',
            marginBottom: 12,
          }}
        >
          Settings
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(34px,4vw,44px)',
            color: '#e8e4d9',
          }}
        >
          WAKE TARGET
        </h1>
      </header>

      <WakeTargetSettings initialWakeTime={profile?.target_wake_time ?? '07:00:00'} />
    </div>
  )
}
