'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { parseTime } from '@/lib/dream-cycle'
import { scheduleNotifications } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

function prettyTime(value: string | null | undefined) {
  if (!value) return '7:00 AM'
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

export default function NotifyPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [sleepTime, setSleepTime] = useState('23:00:00')
  const [requesting, setRequesting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [denied, setDenied] = useState(false)
  const [manualMessage, setManualMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        router.replace('/login?redirectedFrom=%2Fnotify')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_wake_time, target_sleep_time, notification_permission_granted')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      setWakeTime(profile?.target_wake_time ?? '07:00:00')
      setSleepTime(profile?.target_sleep_time ?? '23:00:00')

      const alreadyGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted'
      if (alreadyGranted || profile?.notification_permission_granted) {
        await supabase
          .from('profiles')
          .update({ notification_permission_granted: true, onboarding_complete: true })
          .eq('id', user.id)

        router.replace('/dashboard')
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [router, supabase])

  async function allowNotifications() {
    if (requesting) return
    setRequesting(true)

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const wake = parseTime(wakeTime, '07:00:00')
      const sleep = parseTime(sleepTime, '23:00:00')
      await scheduleNotifications(wake.hour, wake.minute, sleep.hour, sleep.minute)

      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        await supabase
          .from('profiles')
          .update({ notification_permission_granted: true, onboarding_complete: true })
          .eq('id', user.id)
      }

      setSuccess(true)
      setDenied(false)
      setTimeout(() => router.replace('/dashboard'), 2000)
      return
    }

    setDenied(true)
    setRequesting(false)
  }

  async function recheckManualEnable() {
    const granted = Notification.permission === 'granted'
    if (granted) {
      await allowNotifications()
      return
    }

    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (user) {
      await supabase
        .from('profiles')
        .update({ notification_permission_granted: false, onboarding_complete: true })
        .eq('id', user.id)
    }

    setManualMessage('Still denied. Continuing to dashboard with a reminder banner.')
    setTimeout(() => router.replace('/dashboard'), 1200)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(760px, 100%)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>STEP 2 OF 2</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(46px,7vw,66px)', lineHeight: 1.06, marginBottom: 12 }}>
          Allow morning and
          <br />
          evening notifications.
        </h1>
        <p style={{ color: '#c6b4e3', lineHeight: 1.7, marginBottom: 22 }}>
          Somnia sends you exactly two notifications per day.
          <br /><br />
          One in the evening when your planting window opens.
          <br /><br />
          One in the morning when your dream capture window opens.
          <br /><br />
          Nothing else. Ever.
        </p>

        {!success ? (
          <button className={`btn-gold ${requesting ? 'btn-loading' : ''}`} style={{ minHeight: 54 }} onClick={() => void allowNotifications()}>
            {requesting ? 'Requesting...' : 'Allow Notifications ->'}
          </button>
        ) : (
          <div style={{ border: '1px solid rgba(158,231,182,0.4)', borderRadius: 12, background: 'rgba(158,231,182,0.06)', padding: 14 }}>
            <p style={{ color: '#9ee7b6', marginBottom: 6 }}>✓ Notifications enabled.</p>
            <p style={{ color: '#d3c5ea' }}>Your first window opens at {prettyTime(wakeTime)}.</p>
          </div>
        )}

        {denied ? (
          <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 14 }}>
            <p style={{ marginBottom: 8, color: '#efdcff' }}>
              You'll need to enable notifications manually to use Somnia fully.
            </p>
            <p style={{ color: '#c8b6e3', marginBottom: 8 }}>
              iPhone:
              <br />
              {'Settings -> Safari -> Advanced ->'}
              <br />
              {'Website Data -> somniavault.me ->'}
              <br />
              {'Notifications -> Allow'}
            </p>
            <p style={{ color: '#c8b6e3', marginBottom: 12 }}>
              Android:
              <br />
              {'Settings -> Apps -> Chrome ->'}
              <br />
              {'Notifications -> Allow'}
            </p>
            <button className="btn-ghost-gold" onClick={() => void recheckManualEnable()}>
              {"I've enabled them ->"}
            </button>
            {manualMessage ? <p style={{ color: '#f5cf8f', marginTop: 8 }}>{manualMessage}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  )
}
