'use client'

import { useEffect, useMemo, useState } from 'react'

import { scheduleNotifications } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  initialWakeTime: string | null
  initialSleepTime: string | null
}

function toInputTime(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return value.slice(0, 5)
}

export default function DashboardSetupFlow({ userId, initialWakeTime, initialSleepTime }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [wakeTime, setWakeTime] = useState(toInputTime(initialWakeTime, '07:00'))
  const [sleepTime, setSleepTime] = useState(toInputTime(initialSleepTime, '23:00'))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const missingSchedule = !initialWakeTime || initialWakeTime.startsWith('07:00')
  const [scheduleDone, setScheduleDone] = useState(!missingSchedule)
  const [notifDone, setNotifDone] = useState(false)
  const [seedCardDone, setSeedCardDone] = useState(false)

  useEffect(() => {
    const alreadyComplete = localStorage.getItem('somnia_setup_complete') === 'true'

    if (alreadyComplete) {
      setScheduleDone(true)
      setNotifDone(true)
      setSeedCardDone(true)
      setHydrated(true)
      return
    }

    if (!('Notification' in window) || Notification.permission === 'granted') {
      setNotifDone(true)
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (scheduleDone && notifDone && seedCardDone) {
      localStorage.setItem('somnia_setup_complete', 'true')
    }
  }, [hydrated, notifDone, scheduleDone, seedCardDone])

  async function saveSchedule() {
    if (loading) return
    setLoading(true)
    setError(null)

    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          target_wake_time: `${wakeTime}:00`,
          target_sleep_time: `${sleepTime}:00`,
          onboarding_complete: true,
        },
        { onConflict: 'id' }
      )

    if (saveError) {
      setError('Could not save schedule. Please try again.')
      setLoading(false)
      return
    }

    setScheduleDone(true)
    setLoading(false)
  }

  async function enableNotifications() {
    let permission: NotificationPermission = 'denied'

    if ('Notification' in window) {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number)
      const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number)
      await scheduleNotifications(wakeHour, wakeMinute, sleepHour, sleepMinute)

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Welcome to Somnia.', {
          body: 'Your morning and evening windows are set. Sleep well tonight.',
          icon: '/icons/icon-192x192.png',
          tag: 'welcome',
          requireInteraction: false,
          vibrate: [100, 50, 100],
          data: { url: '/dashboard' },
        } as NotificationOptions)
      }
    }

    setNotifDone(true)
  }

  const eveningOpenLabel = useMemo(() => {
    const [h, m] = sleepTime.split(':').map(Number)
    let hour = h
    let minute = m - 30
    if (minute < 0) {
      minute += 60
      hour -= 1
      if (hour < 0) hour += 24
    }
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
  }, [sleepTime])

  if (!hydrated) return null
  if (scheduleDone && notifDone && seedCardDone) return null

  return (
    <section style={{ maxWidth: 860, margin: '20px auto 0', padding: '0 24px' }}>
      {!scheduleDone ? (
        <div style={{ border: '1px solid rgba(200,160,80,0.25)', borderRadius: 14, background: '#100a22', padding: 16 }}>
          <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>Set your sleep schedule</p>
          <label style={{ display: 'block', marginBottom: 6, color: '#d5c8eb' }}>When do you want to wake up?</label>
          <input className="time-picker" type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} style={{ marginBottom: 12 }} />
          <label style={{ display: 'block', marginBottom: 6, color: '#d5c8eb' }}>When do you go to sleep?</label>
          <input className="time-picker" type="time" value={sleepTime} onChange={(event) => setSleepTime(event.target.value)} style={{ marginBottom: 12 }} />
          {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
          <button className={`btn-gold ${loading ? 'btn-loading' : ''}`} onClick={() => void saveSchedule()} disabled={loading}>
            {loading ? 'Saving...' : 'Save Schedule ->'}
          </button>
        </div>
      ) : null}

      {scheduleDone && !notifDone ? (
        <div style={{ border: '1px solid rgba(200,160,80,0.25)', borderRadius: 14, background: '#100a22', padding: 16 }}>
          <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>Enable notifications</p>
          <p style={{ color: '#d5c8eb', marginBottom: 12 }}>Get notified when your morning and evening windows open.</p>
          <button className="btn-gold" onClick={() => void enableNotifications()}>{'Enable ->'}</button>
        </div>
      ) : null}

      {scheduleDone && notifDone && !seedCardDone ? (
        <div style={{ border: '1px solid rgba(200,160,80,0.25)', borderRadius: 14, background: '#100a22', padding: 16 }}>
          <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>Tonight's window opens at {eveningOpenLabel}</p>
          <p style={{ color: '#d5c8eb', marginBottom: 12 }}>Your first dream seed awaits.</p>
          <button className="btn-gold" onClick={() => setSeedCardDone(true)}>Got it</button>
        </div>
      ) : null}
    </section>
  )
}
