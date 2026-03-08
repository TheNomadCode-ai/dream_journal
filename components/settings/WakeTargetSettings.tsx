'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Props = {
  initialWakeTime: string
}

export default function WakeTargetSettings({ initialWakeTime }: Props) {
  const supabase = createClient()
  const [wakeTime, setWakeTime] = useState(initialWakeTime.slice(0, 5))
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function saveWakeTarget() {
    if (saving) return
    setSaving(true)
    setStatus(null)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      setStatus('Could not verify user session.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, target_wake_time: `${wakeTime}:00` }, { onConflict: 'id' })

    if (error) {
      setStatus('Could not save your wake target.')
      setSaving(false)
      return
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const [hour, minute] = wakeTime.split(':').map(Number)
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage({
          type: 'SCHEDULE_WAKE',
          hour,
          minute,
          title: '🌙 Good morning.',
          body: 'Your 5 minute window is open. Capture your dream now.',
        })
      }
    }

    setStatus('Saved ✓')
    setSaving(false)
  }

  return (
    <section style={{ border: '1px solid #2f2250', background: '#100a22', borderRadius: 12, padding: 16 }}>
      <label style={{ display: 'block', color: '#cdbde7', marginBottom: 10 }}>Wake target</label>
      <input
        type="time"
        step={900}
        value={wakeTime}
        onChange={(event) => setWakeTime(event.target.value)}
        style={{
          width: '100%',
          minHeight: 52,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.2)',
          background: '#0f0a1d',
          color: '#fff',
          fontSize: 22,
          padding: '0 10px',
          marginBottom: 12,
        }}
      />
      <button className="btn-gold" onClick={saveWakeTarget} disabled={saving} style={{ minHeight: 44 }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      {status ? <p style={{ color: '#e8dbff', marginTop: 10 }}>{status}</p> : null}
    </section>
  )
}
