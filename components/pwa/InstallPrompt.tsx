'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const dismissed = window.localStorage.getItem('somnia_pwa_prompt_hidden') === '1'
    if (dismissed) {
      setHidden(true)
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setHidden(true)
      window.localStorage.setItem('somnia_pwa_prompt_hidden', '1')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setHidden(true)
      localStorage.setItem('somnia_pwa_prompt_hidden', '1')
    }

    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setHidden(true)
    localStorage.setItem('somnia_pwa_prompt_hidden', '1')
  }

  if (hidden || !deferredPrompt) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 100,
        border: '1px solid #1E2235',
        background: '#12141F',
        padding: '14px 16px',
        maxWidth: '320px',
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
          marginBottom: '8px',
        }}
      >
        Install Somnia
      </p>
      <p
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: '16px',
          lineHeight: 1.55,
          color: '#E8E4D9',
          marginBottom: '12px',
        }}
      >
        Add Somnia to your home screen for faster morning capture.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={handleInstall} className="btn-gold" style={{ padding: '10px 18px' }}>
          Install
        </button>
        <button onClick={handleDismiss} className="btn-ghost-gold" style={{ fontSize: '10px' }}>
          Not now
        </button>
      </div>
    </div>
  )
}