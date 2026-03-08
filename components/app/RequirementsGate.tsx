'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type GateState = 'checking' | 'needs-notification' | 'needs-install' | 'ready'

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
  return iosStandalone || displayStandalone
}

export default function RequirementsGate({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const [gateState, setGateState] = useState<GateState>('checking')
  const [notifDeniedHelp, setNotifDeniedHelp] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)
  const [savingInstallState, setSavingInstallState] = useState(false)

  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

  async function saveInstalledToProfile() {
    setSavingInstallState(true)
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) {
      setSavingInstallState(false)
      return
    }

    await supabase
      .from('profiles')
      .update({ home_screen_installed: true })
      .eq('id', user.id)

    console.log('[Profile] Saved:', { home_screen_installed: true })
    setSavingInstallState(false)
  }

  async function recheckRequirements() {
    if (typeof window === 'undefined') return

    const notifGranted = 'Notification' in window && Notification.permission === 'granted'
    const installed = isStandaloneMode()

    if (!notifGranted) {
      setGateState('needs-notification')
      return
    }

    if (!installed) {
      setGateState('needs-install')
      return
    }

    await saveInstalledToProfile()
    setGateState('ready')
  }

  useEffect(() => {
    void recheckRequirements()

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
    }

    const onFocus = () => {
      void recheckRequirements()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  async function handleEnableNotifications() {
    if (!('Notification' in window)) {
      setNotifDeniedHelp(true)
      return
    }

    const result = await Notification.requestPermission()
    if (result === 'granted') {
      setNotifDeniedHelp(false)
      await recheckRequirements()
      return
    }

    setNotifDeniedHelp(true)
  }

  async function handleAndroidInstall() {
    const deferredPrompt = deferredPromptRef.current
    if (!deferredPrompt) {
      setInstallError('Open browser menu and choose Add to Home Screen, then open Somnia from your home screen icon.')
      return
    }

    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    await recheckRequirements()
  }

  if (gateState === 'ready') {
    return <>{children}</>
  }

  if (gateState === 'checking') {
    return <div style={{ minHeight: '100vh', background: '#06040f' }} />
  }

  if (gateState === 'needs-notification') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(760px, 100%)', textAlign: 'center' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 11, color: '#a995ca', marginBottom: 10 }}>Required</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(44px,7vw,62px)', marginBottom: 14 }}>Enable notifications to continue.</h1>
          <p style={{ color: '#c8b6e3', lineHeight: 1.7, marginBottom: 18 }}>
            Somnia sends you two notifications daily - one in the evening to plant your seed, one in the morning to capture your dream.
            <br /><br />
            Without notifications the app cannot work as intended.
          </p>

          <button className="btn-gold" onClick={() => void handleEnableNotifications()} style={{ minHeight: 50 }}>
            Enable Notifications
          </button>

          {notifDeniedHelp ? (
            <div style={{ marginTop: 16, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 14, textAlign: 'left' }}>
              <p style={{ marginBottom: 10, color: '#efdcff' }}>
                You denied notifications.
              </p>
              <p style={{ color: '#c8b6e3', marginBottom: 8 }}>
                To enable them:
              </p>
              <p style={{ color: '#c8b6e3', marginBottom: 6 }}>{'iPhone: Settings -> Safari -> Notifications -> somniavault.me -> Allow'}</p>
              <p style={{ color: '#c8b6e3', marginBottom: 12 }}>{'Android: Settings -> Apps -> Chrome -> Notifications -> Allow'}</p>
              <p style={{ color: '#c8b6e3', marginBottom: 12 }}>Then refresh this page.</p>
              <button className="btn-ghost-gold" onClick={() => void recheckRequirements()}>
                I've enabled them
              </button>
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(760px, 100%)', textAlign: 'center' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 11, color: '#a995ca', marginBottom: 10 }}>One more thing</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(42px,7vw,62px)', marginBottom: 14 }}>Add Somnia to your home screen.</h1>
        <p style={{ color: '#c8b6e3', lineHeight: 1.7, marginBottom: 16 }}>
          This is required for your morning and evening notifications to arrive reliably.
        </p>

        {isIos ? (
          <div style={{ textAlign: 'left', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p>1. Tap the Share button in Safari.</p>
            <p>2. Tap Add to Home Screen.</p>
            <p>3. Tap Add.</p>
            <p>4. Open Somnia from your home screen.</p>
          </div>
        ) : null}

        {isAndroid && deferredPromptRef.current ? (
          <button className="btn-gold" style={{ minHeight: 50, marginBottom: 12 }} onClick={() => void handleAndroidInstall()}>
            Add to Home Screen
          </button>
        ) : null}

        {isAndroid && !deferredPromptRef.current ? (
          <div style={{ textAlign: 'left', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p>1. Tap the three dots in Chrome.</p>
            <p>2. Tap Add to Home screen.</p>
            <p>3. Tap Add.</p>
            <p>4. Open Somnia from your home screen.</p>
          </div>
        ) : null}

        {!isIos && !isAndroid ? (
          <div style={{ textAlign: 'left', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p>Install this app to your home screen, then reopen it from that icon to continue.</p>
          </div>
        ) : null}

        <button className={`btn-ghost-gold ${savingInstallState ? 'btn-loading' : ''}`} onClick={() => void recheckRequirements()}>
          I've added it - open from home screen
        </button>

        {installError ? <p style={{ color: '#ffb6b6', marginTop: 10 }}>{installError}</p> : null}
      </section>
    </div>
  )
}
