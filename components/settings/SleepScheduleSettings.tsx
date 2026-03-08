'use client'

import { useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { cancelWakeNotification, requestNotificationPermission, scheduleWakeNotification } from '@/lib/notifications'

type Props = {
  initialWakeTime: string
  initialBedtime: string
  initialChronotype: string
  initialNotificationsEnabled: boolean
}

const CHRONOTYPE_OPTIONS = [
  'Early bird (before 6am)',
  'Morning person (6-8am)',
  'Neutral (8-9am)',
  'Night owl (9am+)',
]

function toTimeInput(value: string) {
  return value.slice(0, 5)
}

export default function SleepScheduleSettings({ initialWakeTime, initialBedtime, initialChronotype, initialNotificationsEnabled }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [wakeTime, setWakeTime] = useState(toTimeInput(initialWakeTime))
  const [bedtime, setBedtime] = useState(toTimeInput(initialBedtime))
  const [chronotype, setChronotype] = useState(initialChronotype || 'unknown')
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function saveField(values: Record<string, unknown>, loadingText = 'Saving...') {
    setSaving(true)
    setMessage(loadingText)
    const { data } = await supabase.auth.getUser()
    if (!data.user?.id) {
      setSaving(false)
      return
    }

    await supabase.from('user_profiles').update(values).eq('id', data.user.id)
    setSaving(false)
    setMessage('Saved')
  }

  async function updateWakeTime(value: string) {
    setWakeTime(value)
    await saveField({ target_wake_time: `${value}:00` })
    const [hour, minute] = value.split(':').map(Number)
    if (notificationsEnabled) {
      await scheduleWakeNotification(hour, minute)
    }
  }

  async function updateBedtime(value: string) {
    setBedtime(value)
    await saveField({ target_sleep_time: `${value}:00` })
  }

  async function updateChronotype(value: string) {
    setChronotype(value)
    await saveField({ chronotype: value })
  }

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) {
        const [hour, minute] = wakeTime.split(':').map(Number)
        await scheduleWakeNotification(hour, minute)
        setNotificationsEnabled(true)
        await saveField({ push_enabled: true }, 'Loading...')
      }
      return
    }

    await cancelWakeNotification()
    setNotificationsEnabled(false)
    await saveField({ push_enabled: false }, 'Saving...')
  }

  return (
    <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
      <p style={{ color: '#f2eaff', marginBottom: 14, fontSize: 20 }}>Sleep Schedule</p>

      <label style={{ display: 'block', marginBottom: 8 }}>TARGET WAKE TIME</label>
      <input type="time" value={wakeTime} onChange={(event) => void updateWakeTime(event.target.value)} style={{ width: '100%', minHeight: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#120d24', color: '#fff', padding: '0 10px', marginBottom: 16 }} />

      <label style={{ display: 'block', marginBottom: 8 }}>TARGET BEDTIME</label>
      <input type="time" value={bedtime} onChange={(event) => void updateBedtime(event.target.value)} style={{ width: '100%', minHeight: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#120d24', color: '#fff', padding: '0 10px', marginBottom: 8 }} />
      <p style={{ color: '#bca7de', marginBottom: 16 }}>Aim for 8 hours between these times.</p>

      <label style={{ display: 'block', marginBottom: 8 }}>CHRONOTYPE</label>
      <select value={chronotype} onChange={(event) => void updateChronotype(event.target.value)} style={{ width: '100%', minHeight: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#120d24', color: '#fff', padding: '0 10px', marginBottom: 16 }}>
        <option value="unknown">Unknown</option>
        {CHRONOTYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 10px', marginBottom: 10 }}>
        <p>NOTIFICATIONS</p>
        <button className="btn-gold" onClick={toggleNotifications}>
          {notificationsEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {saving ? <p style={{ color: '#ccb7eb' }}>Saving...</p> : null}
      {message && !saving ? <p style={{ color: '#ccb7eb' }}>{message}</p> : null}
    </section>
  )
}
