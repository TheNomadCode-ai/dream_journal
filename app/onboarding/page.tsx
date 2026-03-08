'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { parseTime } from '@/lib/dream-cycle'
import { scheduleNotifications } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Screen = 1 | 2 | 3 | 4

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
  return iosStandalone || displayStandalone
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const [screen, setScreen] = useState<Screen>(1)
  const [wakeTime, setWakeTime] = useState('07:00')
  const [sleepTime, setSleepTime] = useState('23:00')
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [requestingPermission, setRequestingPermission] = useState(false)
  const [notificationGranted, setNotificationGranted] = useState(false)
  const [permissionHelp, setPermissionHelp] = useState<string | null>(null)

  const [installed, setInstalled] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)

  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

  useEffect(() => {
    let active = true

    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        router.replace('/login?redirectedFrom=%2Fonboarding')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_wake_time, target_sleep_time, onboarding_complete, home_screen_installed')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      if (profile?.target_wake_time) {
        setWakeTime(profile.target_wake_time.slice(0, 5))
      }
      if (profile?.target_sleep_time) {
        setSleepTime(profile.target_sleep_time.slice(0, 5))
      }

      if (profile?.onboarding_complete && profile?.home_screen_installed) {
        router.replace('/dashboard')
        return
      }

      const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted'
      setNotificationGranted(notifGranted)
      setInstalled(isStandaloneMode() || Boolean(profile?.home_screen_installed))

      setLoadingProfile(false)
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
    }

    const onFocus = () => {
      setInstalled(isStandaloneMode())
      setNotificationGranted(typeof Notification !== 'undefined' && Notification.permission === 'granted')
    }

    void load()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      active = false
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [router, supabase])

  async function saveSchedule() {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      router.replace('/login?redirectedFrom=%2Fonboarding')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        target_wake_time: `${wakeTime}:00`,
        target_sleep_time: `${sleepTime}:00`,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Could not save your wake/sleep times. Please try again.')
      return
    }

    setError(null)
    setScreen(3)
  }

  async function requestNotificationAccess() {
    if (requestingPermission) return
    setRequestingPermission(true)
    setPermissionHelp(null)

    if (!('Notification' in window)) {
      setPermissionHelp('Your browser does not support notifications. Use Safari on iOS or Chrome on Android.')
      setRequestingPermission(false)
      return
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    setNotificationGranted(granted)

    if (!granted) {
      setPermissionHelp('Notifications are required. Enable them in browser settings, then tap Try again.')
      setRequestingPermission(false)
      return
    }

    const wake = parseTime(`${wakeTime}:00`, '07:00:00')
    const sleep = parseTime(`${sleepTime}:00`, '23:00:00')
    await scheduleNotifications(wake.hour, wake.minute, sleep.hour, sleep.minute)

    setRequestingPermission(false)
    setScreen(4)
  }

  async function triggerInstallPrompt() {
    const deferredPrompt = deferredPromptRef.current
    if (!deferredPrompt) {
      setInstallError('Use your browser menu to Add to Home Screen, then open Somnia from that icon.')
      return
    }

    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setInstalled(isStandaloneMode())
  }

  async function finishOnboarding() {
    if (finishing) return
    if (!notificationGranted) {
      setError('Please enable notifications before continuing.')
      return
    }
    if (!installed) {
      setError('Please add Somnia to your home screen and open it from that icon before finishing.')
      return
    }

    setFinishing(true)
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
      home_screen_installed: true,
      onboarding_complete: true,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updatedFields }, { onConflict: 'id' })

    if (profileError) {
      setError('Could not complete onboarding. Please try again.')
      setFinishing(false)
      return
    }

    console.log('[Profile] Saved:', updatedFields)
    router.replace('/dashboard')
  }

  if (loadingProfile) {
    return (
      <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center' }}>
        Loading...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(760px, 100%)', minHeight: 'calc(100vh - 48px)', display: 'grid', alignContent: 'space-between', padding: '36px 0 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a18dc7', fontSize: 11, marginBottom: 20 }}>
            Onboarding {screen}/4
          </p>
        </div>

        {screen === 1 ? (
          <>
            <div>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(44px,7vw,68px)', lineHeight: 1.04, textAlign: 'center', marginBottom: 16 }}>
                Dream programming in 2 windows.
              </h1>
              <p style={{ color: '#b8a4d7', textAlign: 'center', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
                Every evening you plant one intention. Every morning you confirm what happened.
                <br /><br />
                This only works if notifications are enabled and Somnia is installed to your home screen.
              </p>
            </div>
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setScreen(2)}>
              Continue
            </button>
          </>
        ) : null}

        {screen === 2 ? (
          <>
            <div>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 8 }}>
                Set your schedule
              </h1>
              <p style={{ color: '#baa7d8', marginBottom: 18 }}>These times control your evening and morning dream windows.</p>

              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, marginBottom: 8 }}>Wake time</h2>
              <input
                className="time-picker"
                type="time"
                step={900}
                value={wakeTime}
                onChange={(event) => setWakeTime(event.target.value)}
                style={{ marginBottom: 18 }}
              />

              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, marginBottom: 8 }}>Sleep time</h2>
              <input
                className="time-picker"
                type="time"
                step={900}
                value={sleepTime}
                onChange={(event) => setSleepTime(event.target.value)}
              />
            </div>
            <div>
              {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost-gold" onClick={() => setScreen(1)}>Back</button>
                <button className="btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => void saveSchedule()}>
                  Continue
                </button>
              </div>
            </div>
          </>
        ) : null}

        {screen === 3 ? (
          <>
            <div>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 8 }}>
                Enable notifications
              </h1>
              <p style={{ color: '#baa7d8', lineHeight: 1.7, marginBottom: 14 }}>
                Somnia must notify you twice daily: evening seed window and morning recall window.
              </p>
              {notificationGranted ? (
                <p style={{ color: '#9ee7b6' }}>Notifications enabled.</p>
              ) : (
                <p style={{ color: '#f5cf8f' }}>Notifications are required to continue.</p>
              )}
              {permissionHelp ? <p style={{ color: '#ffb6b6', marginTop: 10 }}>{permissionHelp}</p> : null}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost-gold" onClick={() => setScreen(2)}>Back</button>
                {!notificationGranted ? (
                  <button className={`btn-gold ${requestingPermission ? 'btn-loading' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => void requestNotificationAccess()}>
                    {requestingPermission ? 'Requesting...' : 'Enable notifications'}
                  </button>
                ) : (
                  <button className="btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setScreen(4)}>
                    Continue
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}

        {screen === 4 ? (
          <>
            <div>
              <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 8 }}>
                Add to home screen
              </h1>
              <p style={{ color: '#baa7d8', lineHeight: 1.7, marginBottom: 14 }}>
                This is required for reliable delivery of your morning and evening notifications.
              </p>

              {isIos ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <p>1. Tap Share in Safari.</p>
                  <p>2. Tap Add to Home Screen.</p>
                  <p>3. Tap Add.</p>
                  <p>4. Open Somnia from your home screen icon.</p>
                </div>
              ) : null}

              {isAndroid && deferredPromptRef.current ? (
                <button className="btn-gold" style={{ marginBottom: 12 }} onClick={() => void triggerInstallPrompt()}>
                  Add to Home Screen
                </button>
              ) : null}

              {isAndroid && !deferredPromptRef.current ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <p>1. Tap the three dots in Chrome.</p>
                  <p>2. Tap Add to Home screen.</p>
                  <p>3. Tap Add.</p>
                  <p>4. Open Somnia from your home screen icon.</p>
                </div>
              ) : null}

              {!isIos && !isAndroid ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <p>Install Somnia, then reopen it from the installed app icon.</p>
                </div>
              ) : null}

              <p style={{ color: installed ? '#9ee7b6' : '#f5cf8f' }}>
                {installed ? 'Home screen install detected.' : 'Waiting for install...'}
              </p>
              {installError ? <p style={{ color: '#ffb6b6', marginTop: 8 }}>{installError}</p> : null}
            </div>

            <div>
              {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost-gold" onClick={() => setScreen(3)}>Back</button>
                <button className="btn-ghost-gold" onClick={() => setInstalled(isStandaloneMode())}>
                  I added it
                </button>
                <button className={`btn-gold ${finishing ? 'btn-loading' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => void finishOnboarding()} disabled={finishing}>
                  {finishing ? 'Finishing...' : 'Finish onboarding'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
