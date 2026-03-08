/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'

import { LIMITS, PRO_UPGRADE_URL, isPro, normalizeTier } from '@/lib/tier-config'
import { createClient } from '@/lib/supabase/server'
import SleepScheduleSettings from '@/components/settings/SleepScheduleSettings'

export default async function SettingsPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, plan, target_wake_time, target_sleep_time, chronotype, push_enabled')
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
          Sleep Schedule
        </h1>
      </header>

      <SleepScheduleSettings
        initialWakeTime={profile?.target_wake_time ?? '07:00:00'}
        initialBedtime={profile?.target_sleep_time ?? '23:00:00'}
        initialChronotype={profile?.chronotype ?? 'unknown'}
        initialNotificationsEnabled={Boolean(profile?.push_enabled)}
      />

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
