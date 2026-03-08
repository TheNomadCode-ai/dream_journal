'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'somnia-morning-light-card-dismissed'

type Props = {
  visible: boolean
}

export default function MorningLightCard({ visible }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(DISMISS_KEY)
    if (stored === '1') setDismissed(true)
  }, [])

  if (!visible || dismissed) return null

  return (
    <section style={{ border: '1px solid rgba(232,193,104,0.38)', background: 'rgba(232,193,104,0.08)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
      <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f0d89e', marginBottom: 8 }}>
        Morning Light Tip
      </p>
      <p style={{ color: '#f7edcf', marginBottom: 8 }}>
        In your first hour after waking, aim for 10-20 minutes of outdoor light. It is one of the strongest daily signals for stabilizing your biological clock.
      </p>
      <button
        className="btn-ghost-gold"
        onClick={() => {
          setDismissed(true)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(DISMISS_KEY, '1')
          }
        }}
      >
        Dismiss
      </button>
    </section>
  )
}
