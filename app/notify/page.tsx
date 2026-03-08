'use client'

import { useEffect, useState } from 'react'

export default function NotifyPage() {
  const [status, setStatus] = useState<'idle' | 'requesting'>('idle')

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof Notification === 'undefined') return

      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        console.log('[Notify] Permission resolved:', Notification.permission)
        clearInterval(interval)
        window.location.href = '/dashboard'
      }
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleAllow = async () => {
    setStatus('requesting')

    try {
      await Notification.requestPermission()
    } catch (error) {
      console.log(error)
    } finally {
      // No matter what happens above, always go to dashboard.
      window.location.href = '/dashboard'
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(760px, 100%)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>STEP 2 OF 2</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(46px,7vw,66px)', lineHeight: 1.06, marginBottom: 12 }}>
          Allow morning and
          <br />
          evening notifications.
        </h1>
        <p style={{ color: '#c6b4e3', lineHeight: 1.7, marginBottom: 22 }}>
          Somnia sends you exactly two notifications per day.
          <br /><br />
          One in the evening when your planting window opens.
          <br /><br />
          One in the morning when your dream capture window opens.
          <br /><br />
          Nothing else. Ever.
        </p>

        <button className={`btn-gold ${status === 'requesting' ? 'btn-loading' : ''}`} style={{ minHeight: 54 }} onClick={() => void handleAllow()}>
          {status === 'requesting' ? 'Requesting...' : 'Allow Notifications ->'}
        </button>

        <button
          onClick={() => {
            window.location.href = '/dashboard'
          }}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.25)',
            cursor: 'pointer',
            marginTop: '24px',
          }}
        >
          continue -&gt;
        </button>
      </section>
    </main>
  )
}
