'use client'

import { useEffect, useState } from 'react'

export function NotificationBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const handleAllow = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted' || permission === 'denied') {
      setShow(false)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const { scheduleNotifications } = await import('@/lib/notifications')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('target_wake_time,target_sleep_time')
          .eq('id', user.id)
          .single()
        if (!profile) return

        const [wakeH, wakeM] = profile.target_wake_time.split(':').map(Number)
        const [sleepH, sleepM] = profile.target_sleep_time.split(':').map(Number)
        await scheduleNotifications(wakeH, wakeM, sleepH, sleepM)
      } catch (error) {
        console.log('[Banner] Schedule err:', error)
      }
    }
  }

  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(20,10,40,0.98)',
        borderBottom: '1px solid rgba(200,160,80,0.25)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.60)',
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        Enable notifications to receive your morning and evening windows.
      </div>

      <button
        onClick={() => void handleAllow()}
        style={{
          flexShrink: 0,
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid rgba(200,160,80,0.50)',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '10px',
          letterSpacing: '0.15em',
          color: 'rgba(200,160,80,0.90)',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Enable
      </button>
    </div>
  )
}
