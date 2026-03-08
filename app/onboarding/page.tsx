'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type Screen = 1 | 2

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [screen, setScreen] = useState<Screen>(1)
  const [wakeTime, setWakeTime] = useState('07:00')
  const [sleepTime, setSleepTime] = useState('23:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveAndContinue() {
    if (saving) return
    setSaving(true)
    setError(null)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      router.replace('/login?redirectedFrom=%2Fonboarding')
      return
    }

    const updatedFields = {
      target_wake_time: `${wakeTime}:00`,
      target_sleep_time: `${sleepTime}:00`,
      onboarding_complete: false,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updatedFields }, { onConflict: 'id' })

    if (profileError) {
      setError('Could not save setup. Please try again.')
      setSaving(false)
      return
    }

    console.log('[Profile] Saved:', updatedFields)
    window.location.href = '/dashboard'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(720px, 100%)', minHeight: 'calc(100vh - 48px)', display: 'grid', alignContent: 'space-between', padding: '36px 0 24px' }}>
        {screen === 1 ? (
          <>
            <div>
              <p style={{ textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a18dc7', fontSize: 11, marginBottom: 40 }}>Somnia</p>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(46px,8vw,72px)', lineHeight: 1.04, textAlign: 'center', marginBottom: 20 }}>
                What if you could choose
                <br />
                what to dream about?
              </h1>
              <p style={{ color: '#b8a4d7', textAlign: 'center', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                Every evening Somnia gives you a short window to plant intention.
                <br />
                Every morning you track whether it appeared.
                <br />
                <br />
                Ancient technique. Modern tracking.
              </p>
            </div>

            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setScreen(2)}>
              Continue
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 48, marginBottom: 8 }}>WHEN DO YOU WAKE UP?</h1>
              <input
                className="time-picker"
                type="time"
                step={900}
                value={wakeTime}
                onChange={(event) => setWakeTime(event.target.value)}
                style={{ marginBottom: 18 }}
              />

              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 38, marginBottom: 8 }}>WHEN DO YOU GO TO SLEEP?</h2>
              <input
                className="time-picker"
                type="time"
                step={900}
                value={sleepTime}
                onChange={(event) => setSleepTime(event.target.value)}
              />

              <p style={{ color: '#b8a4d7', marginTop: 14 }}>
                Next, you will enable notifications for your morning and evening windows.
              </p>
            </div>

            <div>
              {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
              <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void saveAndContinue()} disabled={saving}>
                {saving ? 'Saving...' : 'Continue to dashboard'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
