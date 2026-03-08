'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [wakeTime, setWakeTime] = useState('07:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startDreaming() {
    if (saving) return
    setSaving(true)
    setError(null)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      router.replace('/login?redirectedFrom=%2Fonboarding')
      return
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        target_wake_time: `${wakeTime}:00`,
        onboarding_complete: true,
      }, { onConflict: 'id' })

    if (upsertError) {
      setError('Could not save your wake target. Please try again.')
      setSaving(false)
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const [selectedHour, selectedMinute] = wakeTime.split(':').map(Number)
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage({
          type: 'SCHEDULE_WAKE',
          hour: selectedHour,
          minute: selectedMinute,
          title: '🌙 Good morning.',
          body: 'Your 5 minute window is open. Capture your dream now.',
        })
      }
    } catch {
      // Notification permission is optional and should never block onboarding.
    }

    router.replace('/dashboard')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 20% 10%, rgba(111, 80, 187, 0.35), transparent 40%), #090713',
        color: '#efe8ff',
        padding: 24,
      }}
    >
      <section style={{ width: 'min(560px, 100%)', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 54, marginBottom: 10 }}>🌙 Somnia</p>
        <h1 style={{ fontSize: 28, lineHeight: 1.2, letterSpacing: '0.03em', marginBottom: 12 }}>
          WHEN DO YOU WANT TO WAKE UP?
        </h1>
        <p style={{ color: '#cdbde7', maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.5 }}>
          We&apos;ll send you a notification at this time every morning to capture your dreams.
        </p>

        <input
          type="time"
          step={900}
          value={wakeTime}
          onChange={(event) => setWakeTime(event.target.value)}
          style={{
            width: '100%',
            minHeight: 66,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.2)',
            background: '#0f0a1d',
            color: '#ffffff',
            fontSize: 34,
            textAlign: 'center',
            marginBottom: 16,
          }}
        />

        <button
          onClick={startDreaming}
          disabled={saving}
          className="btn-gold"
          style={{ width: '100%', justifyContent: 'center', minHeight: 50, fontSize: 18 }}
        >
          {saving ? 'Saving...' : 'Start Dreaming →'}
        </button>

        {error ? <p style={{ color: '#ffb6b6', marginTop: 10 }}>{error}</p> : null}
      </section>
    </main>
  )
}
