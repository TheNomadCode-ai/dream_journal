'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Navigator {
    standalone?: boolean
    MSStream?: unknown
  }
}

function detectInstalled() {
  if (typeof window === 'undefined') return false
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = window.navigator.standalone === true
  return displayModeStandalone || iosStandalone
}

export default function InstallPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const [message, setMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.MSStream
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        router.replace('/login?redirectedFrom=%2Finstall')
        return
      }

      const installed = detectInstalled()
      if (!active) return

      if (installed) {
        await supabase
          .from('profiles')
          .update({ home_screen_installed: true })
          .eq('id', user.id)

        router.replace('/notify')
        return
      }
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
    }

    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    void bootstrap()

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }, [router, supabase])

  async function handleAndroidInstall() {
    const deferredPrompt = deferredPromptRef.current
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      router.push('/notify')
    }
  }

  async function handleAlreadyInstalledClick() {
    if (countdown > 0) return

    const installed = detectInstalled()

    if (installed) {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        await supabase
          .from('profiles')
          .update({ home_screen_installed: true })
          .eq('id', user.id)
      }

      router.replace('/notify')
      return
    }

    setMessage('Somnia is still running in the browser. Please close this tab, find the Somnia icon on your home screen, and open it from there.')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(760px, 100%)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>STEP 1 OF 2</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(46px,7vw,66px)', lineHeight: 1.06, marginBottom: 12 }}>
          Add Somnia to your
          <br />
          home screen first.
        </h1>
        <p style={{ color: '#c6b4e3', lineHeight: 1.7, marginBottom: 24 }}>
          This is required for your morning and evening notifications to work reliably.
          Open this page from your home screen to continue.
        </p>

        {isIOS ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16, marginBottom: 20 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, color: '#a995ca', marginBottom: 12 }}>HOW TO ADD ON IOS</p>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><rect x="4" y="11" width="16" height="9" rx="2"/></svg>
                <p>Tap the Share button at the bottom of your Safari browser</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                <p>Tap Add to Home Screen</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><path d="M5 12l4 4L19 6"/></svg>
                <p>Tap Add in the top right corner</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><path d="M3 10.5L12 3l9 7.5"/><path d="M6 9.5V21h12V9.5"/></svg>
                <p>Open Somnia from your home screen and continue setup from there</p>
              </div>
            </div>
          </div>
        ) : null}

        {isAndroid && deferredPromptRef.current ? (
          <button className="btn-gold" style={{ marginBottom: 20 }} onClick={() => void handleAndroidInstall()}>
            {'Add Somnia to Home Screen ->'}
          </button>
        ) : null}

        {isAndroid && !deferredPromptRef.current ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16, marginBottom: 20 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, color: '#a995ca', marginBottom: 12 }}>HOW TO ADD ON ANDROID</p>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                <p>Tap the three dots in Chrome</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                <p>Tap Add to Home Screen</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><path d="M5 12l4 4L19 6"/></svg>
                <p>Tap Add</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><path d="M3 10.5L12 3l9 7.5"/><path d="M6 9.5V21h12V9.5"/></svg>
                <p>Open Somnia from your home screen and continue setup from there</p>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <p style={{ color: '#8f84a7', marginBottom: 8 }}>Already added it?</p>
          <button
            className="btn-ghost-gold"
            disabled={countdown > 0}
            style={{ opacity: countdown > 0 ? 0.45 : 1 }}
            onClick={() => void handleAlreadyInstalledClick()}
          >
            {countdown > 0 ? `I've opened from home screen (${countdown})` : "I've opened from home screen ->"}
          </button>
          {message ? <p style={{ color: '#ffb9ca', marginTop: 10 }}>{message}</p> : null}
        </div>
      </section>
    </main>
  )
}
