'use client'

import { useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { cancelWakeNotification, requestNotificationPermission, scheduleWakeNotification, scheduleWindDownNotification } from '@/lib/notifications'

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

  async function saveField(values: Record<string, unknown>) {
    setSaving(true)
    setMessage('Saved')
    const { data } = await supabase.auth.getUser()
    if (!data.user?.id) {
      setSaving(false)
      return
    }

    void supabase
      .from('profiles')
      .update(values)
      .eq('id', data.user.id)
      .then(({ error }) => {
        if (error) {
          setMessage('Could not save. Try again.')
        }
        setSaving(false)
      }, () => {
        setMessage('Could not save. Try again.')
        setSaving(false)
      })
  }

  async function updateWakeTime(value: string) {
    setWakeTime(value)
    void saveField({ target_wake_time: `${value}:00` })
    const [hour, minute] = value.split(':').map(Number)
    if (notificationsEnabled) {
      void scheduleWakeNotification(hour, minute)
      const [sleepHour, sleepMinute] = bedtime.split(':').map(Number)
      void scheduleWindDownNotification(sleepHour, sleepMinute)
    }
  }

  async function updateBedtime(value: string) {
    setBedtime(value)
    void saveField({ target_sleep_time: `${value}:00` })
    if (notificationsEnabled) {
      const [sleepHour, sleepMinute] = value.split(':').map(Number)
      void scheduleWindDownNotification(sleepHour, sleepMinute)
    }
  }

  async function updateChronotype(value: string) {
    setChronotype(value)
    void saveField({ chronotype: value })
  }

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) {
        const [hour, minute] = wakeTime.split(':').map(Number)
        const [sleepHour, sleepMinute] = bedtime.split(':').map(Number)
        await scheduleWakeNotification(hour, minute)
        await scheduleWindDownNotification(sleepHour, sleepMinute)
        setNotificationsEnabled(true)
        setMessage('Saved')
      }
      return
    }

    await cancelWakeNotification()
    setNotificationsEnabled(false)
    setMessage('Saved')
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
        <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} onClick={toggleNotifications}>
          {notificationsEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {saving ? <p style={{ color: '#ccb7eb' }}>Saving...</p> : null}
      {message && !saving ? <p style={{ color: '#ccb7eb' }}>{message}</p> : null}
    </section>
  )
}
