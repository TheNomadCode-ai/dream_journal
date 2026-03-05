/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

function formatAlarmSummary(alarmTime: string | null, days: number[] | null) {
  if (!alarmTime) return 'Not set'

  const [hour, minute] = alarmTime.slice(0, 5).split(':').map((value) => parseInt(value, 10))
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (!days || days.length === 0 || days.length === 7) {
    return `${time}, Every day`
  }

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const selected = days.map((day) => labels[day - 1]).filter(Boolean)
  return `${time}, ${selected.join(' ')}`
}

export default async function SettingsPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: alarm } = await supabase
    .from('alarms')
    .select('alarm_time, days_of_week, enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 120px' }}>
      <header style={{ marginBottom: '30px' }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '10px',
            color: '#6B6F85',
            marginBottom: '12px',
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
            color: '#E8E4D9',
            letterSpacing: '-0.02em',
          }}
        >
          Alarm & Capture
        </h1>
      </header>

      <section
        style={{
          border: '1px solid #1E2235',
          background: '#12141F',
          display: 'grid',
          gap: '1px',
        }}
      >
        <Link href="/settings/alarm" className="sidebar-link" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <span style={{ color: '#E8E4D9', fontSize: '14px', letterSpacing: '0.06em' }}>Wake-up Alarm</span>
            <span style={{ color: '#6B6F85', fontSize: '12px', letterSpacing: '0.04em' }}>
              {alarm?.enabled ? formatAlarmSummary(alarm.alarm_time, alarm.days_of_week) : 'Disabled'}
            </span>
          </div>
          <span style={{ marginLeft: 'auto', color: '#6B6F85' }}>→</span>
        </Link>

        <div style={{ padding: '16px 18px', borderTop: '1px solid #1E2235' }}>
          <p style={{ color: '#E8E4D9', fontSize: '14px', marginBottom: '6px' }}>Entry Window</p>
          <p style={{ color: '#6B6F85', fontSize: '12px' }}>2 minutes</p>
        </div>

        <Link
          href="/settings/alarm"
          className="sidebar-link"
          style={{ padding: '16px 18px', borderTop: '1px solid #1E2235' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <span style={{ color: '#E8E4D9', fontSize: '14px', letterSpacing: '0.06em' }}>Notifications</span>
            <span style={{ color: '#6B6F85', fontSize: '12px', letterSpacing: '0.04em' }}>
              {alarm?.enabled ? 'Enabled' : 'Configure in Alarm'}
            </span>
          </div>
          <span style={{ marginLeft: 'auto', color: '#6B6F85' }}>→</span>
        </Link>
      </section>
    </div>
  )
}
