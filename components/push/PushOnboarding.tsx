'use client'

import { useMemo, useState } from 'react'

type PushOnboardingProps = {
  wakeTime: string | null
  wakeTimezone: string | null
  pushEnabled: boolean
}

function base64UrlToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export default function PushOnboarding({ wakeTime, wakeTimezone, pushEnabled }: PushOnboardingProps) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const vapidKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '', [])

  if (!wakeTime || pushEnabled) return null

  async function enableReminders() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('error')
      setMessage('Push notifications are not supported in this browser.')
      return
    }

    if (!vapidKey) {
      setStatus('error')
      setMessage('Missing VAPID public key configuration.')
      return
    }

    setStatus('pending')
    setMessage(null)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('error')
        setMessage('Notification permission was not granted.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidKey),
      })

      const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          wakeTime,
          wakeTimezone: resolvedTimezone || wakeTimezone || 'UTC',
        }),
      })

      if (!response.ok) {
        throw new Error('Could not save push subscription')
      }

      setStatus('done')
      setMessage('Daily morning reminders are enabled.')
    } catch {
      setStatus('error')
      setMessage('Could not enable reminders right now. Please try again.')
    }
  }

  return (
    <section
      style={{
        border: '1px solid #1E2235',
        background: '#12141F',
        padding: '18px 22px',
        margin: '24px 0 0',
      }}
    >
      <p
        style={{
          fontFamily: "'Josefin Sans', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontSize: '10px',
          fontWeight: 300,
          color: '#C9A84C',
          marginBottom: '10px',
        }}
      >
        Morning reminder
      </p>
      <p
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: '17px',
          lineHeight: 1.65,
          color: '#E8E4D9',
          marginBottom: '14px',
        }}
      >
        Enable a daily reminder at {wakeTime.slice(0, 5)} so you can capture dreams while they are still vivid.
      </p>

      <button
        onClick={enableReminders}
        disabled={status === 'pending' || status === 'done'}
        className="btn-gold"
        style={{ opacity: status === 'pending' ? 0.7 : 1 }}
      >
        {status === 'done' ? 'Enabled' : 'Enable reminders'}
      </button>

      {message && (
        <p
          style={{
            marginTop: '10px',
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '9px',
            color: status === 'error' ? '#B06A74' : '#6B6F85',
          }}
        >
          {message}
        </p>
      )}
    </section>
  )
}
