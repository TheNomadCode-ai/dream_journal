'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { subscribeToPush } from '@/lib/push-notifications'
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
  const [step, setStep] = useState<'schedule' | 'notifications'>('schedule')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      const done = localStorage.getItem('onboarding_complete') === 'true'
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

  async function saveSchedule() {
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

    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          target_wake_time: `${wakeTime}:00`,
          target_sleep_time: `${sleepTime}:00`,
          onboarding_complete: true,
        },
        { onConflict: 'id' }
      )

    if (saveError) {
      setError('Could not save your schedule. Please try again.')
      setLoading(false)
      return
    }

    setStep('notifications')
    setLoading(false)
  }

  async function enableAndContinue() {
    if (loading) return
    setLoading(true)
    setError(null)

    const result = await subscribeToPush()
    if (!result.success) {
      setError(result.error || 'Notifications were not enabled. You can enable them later in Settings.')
    }

    localStorage.setItem('onboarding_complete', 'true')
    localStorage.setItem('somnia_setup_complete', 'true')
    router.replace('/dashboard')
    router.refresh()
  }

  if (!ready) return null

  return (
    <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 560 }}>
        <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 14 }}>Setup</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(38px,8vw,56px)', lineHeight: 1.08, marginBottom: 12 }}>
          Tune your Somnia cycle.
        </h1>

        {step === 'schedule' ? (
          <section style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16 }}>
            <p style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>Step 1 - Set your times</p>
            <div style={{ marginBottom: 12 }}>
              <TimeWheelPicker value={wakeTime} onChange={setWakeTime} label="When do you wake up?" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <TimeWheelPicker value={sleepTime} onChange={setSleepTime} label="When do you go to sleep?" />
            </div>
            {error ? <p style={{ color: '#ffb9ca', marginBottom: 10 }}>{error}</p> : null}
            <button className={`btn-gold ${loading ? 'btn-loading' : ''}`} onClick={() => void saveSchedule()} disabled={loading}>
              {loading ? 'Saving...' : 'Save times ->'}
            </button>
          </section>
        ) : (
          <section style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16 }}>
            <p style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>Step 2 - Enable notifications</p>
            <p style={{ color: '#d6c9eb', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 12 }}>
              Allow notifications to get your morning and evening prompts at the right time.
            </p>
            {error ? <p style={{ color: '#ffb9ca', marginBottom: 10 }}>{error}</p> : null}
            <button className={`btn-gold ${loading ? 'btn-loading' : ''}`} onClick={() => void enableAndContinue()} disabled={loading}>
              {loading ? 'Continuing...' : 'Enable and continue ->'}
            </button>
          </section>
        )}
      </section>
    </main>
  )
}
