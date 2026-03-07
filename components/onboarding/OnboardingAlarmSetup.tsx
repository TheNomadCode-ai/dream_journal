'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

function localTimeDefault() {
  const now = new Date()
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

export default function OnboardingAlarmSetup() {
  const router = useRouter()
  const [alarmTime, setAlarmTime] = useState(localTimeDefault)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', [])

  async function handleContinue() {
    setSaving(true)
    setError(null)

    const response = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alarm_time: alarmTime,
        enabled: true,
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        snooze_seconds: 0,
        timezone,
      }),
    })

    setSaving(false)

    if (!response.ok) {
      setError('Could not save your alarm. Please try again.')
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0B12',
        color: '#E8E4D9',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
      }}
    >
      <div style={{ width: 'min(560px, 100%)', textAlign: 'center' }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌙</span>
          <span
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 28,
              letterSpacing: '-0.01em',
            }}
          >
            Somnia
          </span>
        </div>

        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontSize: 11,
            color: '#C9A84C',
            marginBottom: 12,
          }}
        >
          Before anything else.
        </p>

        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 20,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.82)',
            marginBottom: 24,
          }}
        >
          Somnia works differently to every other journal app. Dreams fade within 2 minutes of waking. So the journal only opens when your alarm fires and locks 2 minutes later.
        </p>

        <div
          style={{
            border: '1px solid #1E2235',
            background: '#12141F',
            borderRadius: 14,
            padding: 18,
            textAlign: 'left',
          }}
        >
          <label
            htmlFor="onboarding-alarm-time"
            style={{
              display: 'block',
              marginBottom: 8,
              fontFamily: "'Josefin Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: 10,
              color: '#6B6F85',
            }}
          >
            Set your wake-up alarm
          </label>

          <input
            id="onboarding-alarm-time"
            type="time"
            value={alarmTime}
            onChange={(event) => setAlarmTime(event.target.value)}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.14)',
              background: '#0A0B12',
              color: '#E8E4D9',
              padding: '0 12px',
              marginBottom: 12,
            }}
          />

          {error && <p style={{ color: '#B06A74', fontSize: 13, marginBottom: 10 }}>{error}</p>}

          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {saving ? 'Saving alarm…' : 'Set Alarm and Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
