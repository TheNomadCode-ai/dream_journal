'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { requestNotificationPermission, scheduleWakeNotification, scheduleWindDownNotification } from '../../lib/notifications'

type Props = {
  targetWakeTime: string
  targetSleepTime: string
  homeScreenInstalled: boolean
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallGate({ targetWakeTime, targetSleepTime, homeScreenInstalled }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [seconds, setSeconds] = useState(5)
  const [message, setMessage] = useState<string | null>(null)
  const [notifStatus, setNotifStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

  function isStandaloneMode() {
    if (typeof window === 'undefined') return false
    const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    return standaloneMatch || iosStandalone
  }

  useEffect(() => {
    if (isStandaloneMode() || homeScreenInstalled) {
      void (async () => {
        const { data } = await supabase.auth.getUser()
        const userId = data.user?.id
        if (userId) {
          await supabase.from('profiles').update({ home_screen_installed: true }).eq('id', userId)
        }
        router.replace('/dashboard')
      })()
      return
    }

    const timer = window.setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }, [homeScreenInstalled, router, supabase])

  async function enableNotifications() {
    const granted = await requestNotificationPermission()
    if (!granted) {
      setNotifStatus('You can enable this in your browser settings later.')
      return
    }

    const [hour, minute] = targetWakeTime.slice(0, 5).split(':').map(Number)
    const [sleepHour, sleepMinute] = targetSleepTime.slice(0, 5).split(':').map(Number)
    await scheduleWakeNotification(hour, minute)
    await scheduleWindDownNotification(sleepHour, sleepMinute)
    setNotifStatus('✓ confirmed')
  }

  async function confirmInstall() {
    if (seconds > 0 || saving) return
    setSaving(true)

    if (!isStandaloneMode()) {
      setSaving(false)
      setMessage("It looks like Somnia isn't running from your home screen yet. Follow the steps above then open Somnia from your home screen icon.")
      return
    }

    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id
    if (userId) {
      await supabase.from('profiles').update({ home_screen_installed: true }).eq('id', userId)
    }

    router.replace('/dashboard')
  }

  async function triggerAndroidInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06040f', color: '#f3ecff', padding: '28px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, filter: 'drop-shadow(0 0 16px rgba(180,130,255,0.8))' }}>🌙</div>
          <p style={{ marginTop: 14, fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 12 }}>One last step.</p>
          <p style={{ marginTop: 10, color: 'rgba(241,232,255,0.8)', lineHeight: 1.6 }}>
            Add Somnia to your home screen to keep your morning and evening notification windows reliable.
          </p>
        </div>

        <section style={{ border: '1px solid rgba(180,130,255,0.25)', borderRadius: 14, padding: 18, background: 'rgba(16,12,32,0.78)', marginBottom: 16 }}>
          {isIOS ? (
            <div>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>How to add on iPhone</p>
              <p>1. Tap the Share button at the bottom of Safari.</p>
              <p>2. Scroll and tap "Add to Home Screen".</p>
              <p>3. Tap "Add" top right.</p>
              <p>4. Open Somnia from your home screen.</p>
            </div>
          ) : null}

          {isAndroid && deferredPrompt ? (
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={triggerAndroidInstall}>
              Add Somnia to Home Screen
            </button>
          ) : null}

          {isAndroid && !deferredPrompt ? (
            <div>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>How to add on Android</p>
              <p>1. Tap the three dots top right of Chrome.</p>
              <p>2. Tap "Add to home screen".</p>
              <p>3. Tap "Add".</p>
              <p>4. Open Somnia from your home screen.</p>
            </div>
          ) : null}
        </section>

        <section style={{ border: '1px solid rgba(180,130,255,0.25)', borderRadius: 14, padding: 18, background: 'rgba(16,12,32,0.78)', marginBottom: 16 }}>
          <p style={{ marginBottom: 12 }}>
            While you're here, allow morning notifications so Somnia can remind you to log your wake time.
          </p>
          <button className="btn-gold" onClick={enableNotifications}>
            Enable Notifications →
          </button>
          {notifStatus ? <p style={{ marginTop: 10, color: '#d9c8ff' }}>{notifStatus}</p> : null}
        </section>

        <button
          className="btn-gold"
          style={{ width: '100%', justifyContent: 'center', opacity: seconds > 0 ? 0.5 : 1, boxShadow: seconds === 0 ? '0 0 18px rgba(230,192,122,0.52)' : 'none' }}
          disabled={seconds > 0 || saving}
          onClick={confirmInstall}
        >
          {seconds > 0 ? `I've Added Somnia (${seconds})` : "I've Added Somnia →"}
        </button>

        {message ? <p style={{ marginTop: 10, color: '#ffb9ca' }}>{message}</p> : null}
      </div>
    </div>
  )
}
