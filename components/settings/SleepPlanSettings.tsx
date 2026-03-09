'use client'

import { useMemo, useState } from 'react'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { parseTime } from '@/lib/dream-cycle'
import { scheduleNotifications } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

type Props = {
  initialWakeTime: string
  initialSleepTime: string
  tier: string
  isTrial: boolean
  trialDaysRemaining: number
}

function toInput(value: string) {
  return value.slice(0, 5)
}

export default function SleepPlanSettings({ initialWakeTime, initialSleepTime, tier, isTrial, trialDaysRemaining }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const currentWakeTime = toInput(initialWakeTime || '07:00:00')
  const currentSleepTime = toInput(initialSleepTime || '23:00:00')
  const [wakeTime, setWakeTime] = useState(toInput(initialWakeTime || '07:00:00'))
  const [sleepTime, setSleepTime] = useState(toInput(initialSleepTime || '23:00:00'))
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setMessage(null)

    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) {
      setSaving(false)
      return
    }

    const updatedFields = {
      id: user.id,
      target_wake_time: wakeTime,
      target_sleep_time: sleepTime,
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updatedFields, { onConflict: 'id' })

    if (error) {
      console.error('Save failed:', error)
      setMessage('Could not save. Try again.')
      setSaving(false)
      return
    }

    console.log('[Profile] Saved:', updatedFields)
    setMessage('Saved')

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission

      if (permission === 'granted') {
        const wake = parseTime(wakeTime, '07:00:00')
        const sleep = parseTime(sleepTime, '23:00:00')
        void scheduleNotifications(wake.hour, wake.minute, sleep.hour, sleep.minute)
      }
    }

    window.location.href = '/dashboard'
  }

  function onSaveClick() {
    const timesChanged = wakeTime !== currentWakeTime || sleepTime !== currentSleepTime
    if (timesChanged) {
      setShowConfirmModal(true)
      return
    }
    void handleSave()
  }

  return (
    <>
      <div style={{ display: 'grid', gap: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Settings
          </div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Sleep schedule and plan
          </h1>
        </div>

        <button
          onClick={onSaveClick}
          disabled={saving}
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            background: 'transparent',
            border: '1px solid rgba(200,160,80,0.5)',
            borderRadius: '4px',
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: saving
              ? 'rgba(200,160,80,0.4)'
              : 'rgba(200,160,80,0.9)',
            textTransform: 'uppercase',
            cursor: saving ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Sleep schedule</p>

        <div style={{ marginBottom: 16 }}>
          <TimeWheelPicker
            value={wakeTime}
            label="Wake time"
            onChange={setWakeTime}
          />
        </div>

        <TimeWheelPicker
          value={sleepTime}
          label="Sleep time"
          onChange={setSleepTime}
        />

        {message ? <p style={{ color: '#cfbde7', marginTop: 10 }}>{message}</p> : null}
      </section>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Plan</p>
        <p style={{ color: '#efe8ff', marginBottom: 8 }}>
          Current: {isTrial ? 'Pro (trial)' : tier === 'pro' ? 'Pro' : 'Free'}
        </p>
        {isTrial ? (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 8 }}>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining</p>
            <p style={{ color: '#cbb7e4' }}>Pro features unlocked during your trial.</p>
          </>
        ) : tier === 'pro' ? (
          <p style={{ color: '#cbb7e4' }}>Pro features unlocked.</p>
        ) : (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 12 }}>Free includes unlimited dream journaling and archive.</p>
            <a href="https://sushankhanal.gumroad.com/l/somniavault" target="_blank" rel="noreferrer" className="btn-gold">
              Upgrade to Pro - $4.99/mo
            </a>
          </>
        )}
      </section>
      </div>

      {showConfirmModal ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#0e0a1f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '32px 24px',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: 'rgba(255,255,255,0.38)', marginBottom: 10 }}>
              Changing your sleep schedule
            </p>
            <h3 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 42, marginBottom: 10 }}>Are you sure?</h3>
            <p style={{ color: '#bca7de', lineHeight: 1.7, marginBottom: 18 }}>
              Your dream windows are built around your sleep rhythm. Changing your times frequently makes it harder to build the habit.
              <br /><br />
              Sleep at consistent times. Your subconscious responds to rhythm.
            </p>

            <button
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={() => setShowConfirmModal(false)}
            >
              Keep my current times
            </button>
            <button
              className="btn-ghost-gold"
              style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,0.55)' }}
              onClick={() => {
                setShowConfirmModal(false)
                void handleSave()
              }}
            >
              Yes, update my schedule
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
