'use client'

import { useEffect } from 'react'

export default function InstallPromptCapture() {
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] Install prompt captured')
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  return null
}
