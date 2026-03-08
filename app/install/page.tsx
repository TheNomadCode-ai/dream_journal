'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

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

  const [canInstall, setCanInstall] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.MSStream
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    if (window.__pwaInstallPrompt) {
      setCanInstall(true)
      console.log('[Install] Prompt available')
    } else {
      console.log('[Install] No prompt - showing manual steps')
      setShowManual(true)
    }

    if (detectInstalled()) {
      void (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (userId) {
          await supabase.from('profiles').update({ home_screen_installed: true }).eq('id', userId)
        }
        router.replace('/notify')
      })()
    }

    return () => {
      window.clearInterval(timer)
    }
  }, [router, supabase])

  async function handleInstall() {
    console.log('[Install] Button clicked')
    console.log('[Install] Prompt available:', !!window.__pwaInstallPrompt)

    const prompt = window.__pwaInstallPrompt
    if (!prompt) {
      console.log('[Install] No prompt stored')
      setMessage('Automatic install prompt is unavailable right now. Use the manual steps below.')
      setShowManual(true)
      return
    }

    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      console.log('[Install] User choice:', outcome)

      if (outcome === 'accepted') {
        window.__pwaInstallPrompt = null
        router.push('/notify')
      } else {
        setShowManual(true)
      }
    } catch (err) {
      console.error('[Install] prompt() failed:', err)
      setShowManual(true)
    }
  }

  async function handleAlreadyInstalledClick() {
    if (countdown > 0) return

    const installed = detectInstalled()

    if (installed) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ home_screen_installed: true })
          .eq('id', userId)
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

        {isAndroid ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: '#100a22', padding: 16, marginBottom: 20 }}>
            <button className="btn-gold" style={{ marginBottom: 14, width: '100%', justifyContent: 'center', opacity: canInstall ? 1 : 0.7 }} disabled={!canInstall} onClick={() => void handleInstall()}>
              Add Somnia to Home Screen
            </button>
            {showManual ? (
              <>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, color: '#a995ca', marginBottom: 12 }}>Or add manually:</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    <p>Tap the three dots in Chrome top right</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9defa" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                    <p>Tap Add to Home screen</p>
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
              </>
            ) : null}
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
