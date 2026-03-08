'use client'

import { useEffect, useState } from 'react'

export default function NotificationReminderBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      setShow(true)
      return
    }

    setShow(Notification.permission !== 'granted')
  }, [])

  if (!show) return null

  return (
    <a
      href="/settings"
      style={{
        display: 'block',
        border: '1px solid rgba(232,193,104,0.4)',
        background: 'rgba(232,193,104,0.1)',
        color: '#f2dfab',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 14,
      }}
    >
      Enable notifications to get your morning reminder →
    </a>
  )
}
