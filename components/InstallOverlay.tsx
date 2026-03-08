'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function isStandaloneMode() {
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return displayStandalone || iosStandalone
}

export function InstallOverlay() {
  const [show, setShow] = useState(false)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isStandaloneMode()) {
      setInstalled(true)
      return
    }

    if (window.__pwaInstallPrompt) {
      setPrompt(window.__pwaInstallPrompt)
      setShow(true)
    }

    const handler = (event: Event) => {
      event.preventDefault()
      const capturedPrompt = event as BeforeInstallPromptEvent
      console.log('[Overlay] Prompt captured')
      window.__pwaInstallPrompt = capturedPrompt
      setPrompt(capturedPrompt)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || installed) return null

  const handleInstall = async () => {
    const activePrompt = prompt ?? window.__pwaInstallPrompt
    if (!activePrompt) return

    // prompt() must run directly in this click handler.
    activePrompt.prompt()
    const { outcome } = await activePrompt.userChoice

    console.log('[Overlay] Outcome:', outcome)

    if (outcome === 'accepted') {
      window.__pwaInstallPrompt = null
      setInstalled(true)
      setShow(false)
      setPrompt(null)
      router.replace('/notify')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#06040f',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 100 100"
        style={{ marginBottom: '32px', filter: 'drop-shadow(0 0 20px rgba(180,130,255,0.6))' }}
      >
        <defs>
          <radialGradient id="mg" cx="32%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(240,225,255,1)" />
            <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#mg)" />
        <circle cx="66" cy="44" r="35" fill="#06040f" />
      </svg>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: 'rgba(180,130,255,0.6)',
          textTransform: 'uppercase',
          marginBottom: '20px',
        }}
      >
        One last step
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '28px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.90)',
          textAlign: 'center',
          lineHeight: 1.3,
          marginBottom: '16px',
        }}
      >
        Add Somnia to your
        <br />
        home screen.
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.40)',
          textAlign: 'center',
          lineHeight: 1.7,
          maxWidth: '300px',
          marginBottom: '48px',
        }}
      >
        Required for morning and evening notifications to work reliably.
      </div>

      <button
        onClick={() => void handleInstall()}
        style={{
          width: '100%',
          maxWidth: '320px',
          padding: '18px 24px',
          background: 'transparent',
          border: '1px solid rgba(200,160,80,0.5)',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: 'rgba(200,160,80,0.9)',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Add to Home Screen
      </button>
    </div>
  )
}
