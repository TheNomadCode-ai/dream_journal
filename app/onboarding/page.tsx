'use client'

import { useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Screen = 1 | 2

export default function OnboardingPage() {
  const supabase = useMemo(() => createClient(), [])

  const [screen, setScreen] = useState<Screen>(1)
  const [wakeTime, setWakeTime] = useState('07:00')
  const [sleepTime, setSleepTime] = useState('23:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log('User:', user?.id, userError)

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data, error: saveError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            target_wake_time: wakeTime,
            target_sleep_time: sleepTime,
            onboarding_complete: true,
          },
          {
            onConflict: 'id',
          }
        )
        .select()
        .single()

      console.log('Save result:', data, saveError)

      if (saveError) {
        setError('Could not save. Try again.')
        setSaving(false)
        return
      }

      const { data: verify } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()

      console.log('Verified:', verify)

      if (!verify?.onboarding_complete) {
        setError('Save failed. Try again.')
        setSaving(false)
        return
      }

      window.location.href = '/install'
    } catch (err) {
      console.log('Error:', err)
      setError('Something went wrong.')
      setSaving(false)
    }
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
                Next, you'll finish installation.
              </p>
            </div>

            <div>
              {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
              <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void handleComplete()} disabled={saving}>
                {saving ? 'Saving...' : 'Continue to install'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
