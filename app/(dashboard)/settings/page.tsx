/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'

import { LIMITS, PRO_UPGRADE_URL, isPro, normalizeTier } from '@/lib/tier-config'
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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, plan')
    .eq('id', user.id)
    .maybeSingle()

  const tier = normalizeTier(profile?.tier ?? profile?.plan)

  const { count: dreamCount } = await supabase
    .from('dreams')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const { count: notebookCount } = await supabase
    .from('notebooks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const safeDreamCount = dreamCount ?? 0
  const safeNotebookCount = notebookCount ?? 0
  const dreamProgress = Math.min(100, Math.round((safeDreamCount / LIMITS.free.maxEntries) * 100))
  const notebookProgress = Math.min(100, Math.round((safeNotebookCount / LIMITS.free.maxNotebooks) * 100))

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

      <section
        style={{
          marginTop: 26,
          border: '1px solid #1E2235',
          background: '#12141F',
          borderRadius: 12,
          padding: '18px 18px 20px',
        }}
      >
        <p style={{ color: '#E8E4D9', fontSize: '15px', margin: 0, marginBottom: 16 }}>Current Plan</p>

        {isPro(tier) ? (
          <div>
            <p style={{ margin: 0, color: '#E8E4D9', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              ✦ {tier === 'lifetime' ? 'Lifetime' : 'Pro'}
            </p>
            <p style={{ margin: 0, color: '#9FA5C2', fontSize: 13, marginBottom: 4 }}>
              Unlimited entries and notebooks
            </p>
            <p style={{ margin: 0, color: '#9FA5C2', fontSize: 13, marginBottom: 4 }}>
              All features unlocked
            </p>
            <p style={{ margin: 0, color: '#9FA5C2', fontSize: 13, marginBottom: 14 }}>
              Priority support badge active
            </p>
            <Link href="https://gumroad.com/login" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', fontSize: 13 }}>
              Manage subscription →
            </Link>
          </div>
        ) : (
          <div>
            <p style={{ margin: 0, color: '#E8E4D9', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Free</p>

            <p style={{ margin: 0, color: '#9FA5C2', fontSize: 13, marginBottom: 6 }}>{safeDreamCount}/30 entries used</p>
            <div style={{ height: 8, borderRadius: 999, background: '#1E2235', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: `${dreamProgress}%`, height: '100%', background: '#C9A84C' }} />
            </div>

            <p style={{ margin: 0, color: '#9FA5C2', fontSize: 13, marginBottom: 6 }}>{safeNotebookCount}/1 notebooks used</p>
            <div style={{ height: 8, borderRadius: 999, background: '#1E2235', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${notebookProgress}%`, height: '100%', background: '#C9A84C' }} />
            </div>

            <Link href={PRO_UPGRADE_URL} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ display: 'inline-block' }}>
              Upgrade to Pro - $4.99/mo
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
