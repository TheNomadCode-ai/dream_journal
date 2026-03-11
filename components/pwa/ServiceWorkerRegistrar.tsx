'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    const ensureRegistration = async () => {
      try {
        const existingRegistration =
          (await navigator.serviceWorker.getRegistration('/')) ??
          (await navigator.serviceWorker.getRegistration())

        if (existingRegistration) {
          await existingRegistration.update()
          return
        }

        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (error) {
        if (!cancelled) {
          console.error('Service worker registration failed', error)
        }
      }
    }

    if (document.readyState === 'complete') {
      void ensureRegistration()
    } else {
      window.addEventListener('load', ensureRegistration, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', ensureRegistration)
    }
  }, [])

  return null
}
