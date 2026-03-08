'use client'

import { useState } from 'react'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { useProfile } from '@/lib/ProfileContext'
import { createClient } from '@/lib/supabase/client'

type Props = {
  initialWakeTime: string
}

export default function WakeTargetSettings({ initialWakeTime }: Props) {
  const supabase = createClient()
  const { profile, setProfile } = useProfile()
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

    // Optimistically update local cached profile immediately.
    setProfile((current) => {
      const base = current ?? profile
      if (!base) return current
      return { ...base, target_wake_time: `${wakeTime}:00` }
    })
    setStatus('Saved ✓')

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const [hour, minute] = wakeTime.split(':').map(Number)
        void navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({
            type: 'SCHEDULE_WAKE',
            hour,
            minute,
            title: '🌙 Good morning.',
            body: 'Your 5 minute window is open. Capture your dream now.',
          })
        })
      }
    }

    void supabase
      .from('profiles')
      .upsert({ id: user.id, target_wake_time: `${wakeTime}:00` }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) {
          setStatus('Could not save your wake target.')
        }
        setSaving(false)
      }, () => {
        setStatus('Could not save your wake target.')
        setSaving(false)
      })
  }

  return (
    <section style={{ border: '1px solid #2f2250', background: '#100a22', borderRadius: 12, padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <TimeWheelPicker value={wakeTime} onChange={setWakeTime} label="Wake target" />
      </div>
      <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} onClick={saveWakeTarget} disabled={saving} style={{ minHeight: 44 }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      {status ? <p style={{ color: '#e8dbff', marginTop: 10 }}>{status}</p> : null}
    </section>
  )
}
