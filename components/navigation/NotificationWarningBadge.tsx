'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
}

export default function NotificationWarningBadge({ userId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [notifOff, setNotifOff] = useState(false)
  const [missingSubscription, setMissingSubscription] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const permissionOff =
      typeof Notification !== 'undefined' &&
      Notification.permission !== 'granted'

    setNotifOff(permissionOff)

    let active = true

    void (async () => {
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!active) return
      setMissingSubscription(!subscription)
      setReady(true)
    })()

    return () => {
      active = false
    }
  }, [supabase, userId])

  if (!ready || !(notifOff || missingSubscription)) {
    return null
  }

  return (
    <Link
      href="/settings"
      aria-label="Notifications are off. Open settings."
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 120,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,110,110,0.4)',
        background: 'rgba(120,8,25,0.86)',
        color: '#ffd8d8',
        textDecoration: 'none',
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4b4b' }}
      />
      <span>Notifications off</span>
    </Link>
  )
}
