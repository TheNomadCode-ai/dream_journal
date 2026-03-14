'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { createClient } from '@/lib/supabase/client'

function toInputTime(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return value.slice(0, 5)
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [wakeTime, setWakeTime] = useState('07:00')
  const [sleepTime, setSleepTime] = useState('23:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      const done = localStorage.getItem('onboarding_done') === 'true'
      if (done) {
        router.replace('/dashboard')
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return
      if (!user) {
        router.replace('/login?redirectedFrom=%2Fonboarding')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_wake_time,target_sleep_time')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      setWakeTime(toInputTime(profile?.target_wake_time, '07:00'))
      setSleepTime(toInputTime(profile?.target_sleep_time, '23:00'))
      setReady(true)
    })()

    return () => {
      active = false
    }
  }, [router, supabase])

  async function handleBegin() {
    if (loading) return
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Could not verify your session. Please log in again.')
      setLoading(false)
      return
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          target_wake_time: `${wakeTime}:00`,
          target_sleep_time: `${sleepTime}:00`,
          timezone,
          wake_timezone: timezone,
        },
        { onConflict: 'id' }
      )

    if (saveError) {
      setError('Could not save your schedule. Please try again.')
      setLoading(false)
      return
    }

    localStorage.setItem('onboarding_done', 'true')
    router.replace('/dashboard')
    router.refresh()
  }

  if (!ready) return null

  return (
    <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 18 }}>
          <svg width="56" height="56" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 20px rgba(180,130,255,0.6))' }}>
            <defs>
              <radialGradient id="onboarding-moon" cx="32%" cy="30%" r="65%">
                <stop offset="0%" stopColor="rgba(240,225,255,1)" />
                <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="url(#onboarding-moon)" />
            <circle cx="66" cy="44" r="35" fill="#06040f" />
          </svg>
        </div>

        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(38px,8vw,56px)', lineHeight: 1.08, marginBottom: 12, textAlign: 'center' }}>
          When do you sleep?
        </h1>
        <p style={{ color: '#d6c9eb', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 18, textAlign: 'center' }}>
          Somnia will notify you at the right moment.
        </p>

        <section style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <TimeWheelPicker value={wakeTime} onChange={setWakeTime} label="Wake time" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <TimeWheelPicker value={sleepTime} onChange={setSleepTime} label="Sleep time" />
          </div>
          {error ? <p style={{ color: '#ffb9ca', marginBottom: 10 }}>{error}</p> : null}
          <button className={`btn-gold ${loading ? 'btn-loading' : ''}`} style={{ width: '100%', justifyContent: 'center', minHeight: 52 }} onClick={() => void handleBegin()} disabled={loading}>
            {loading ? 'Saving...' : 'Begin'}
          </button>
        </section>
      </section>
    </main>
  )
}
