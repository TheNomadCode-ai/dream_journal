'use client'

import { useMemo, useState } from 'react'

import { parseTime } from '@/lib/dream-cycle'
import { scheduleNotifications } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

type Props = {
  initialWakeTime: string
  initialSleepTime: string
  tier: string
  isTrial: boolean
  trialDaysRemaining: number
}

function toInput(value: string) {
  return value.slice(0, 5)
}

export default function SleepPlanSettings({ initialWakeTime, initialSleepTime, tier, isTrial, trialDaysRemaining }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [wakeTime, setWakeTime] = useState(toInput(initialWakeTime || '07:00:00'))
  const [sleepTime, setSleepTime] = useState(toInput(initialSleepTime || '23:00:00'))
  const [message, setMessage] = useState<string | null>(null)

  async function saveSchedule(nextWake: string, nextSleep: string) {
    setMessage(null)

    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return

    const updatedFields = {
      target_wake_time: `${nextWake}:00`,
      target_sleep_time: `${nextSleep}:00`,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatedFields)
      .eq('id', user.id)

    if (error) {
      setMessage('Could not save. Try again.')
      return
    }

    console.log('[Profile] Saved:', updatedFields)
    setMessage('Saved')

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission

      if (permission === 'granted') {
        const wake = parseTime(`${nextWake}:00`, '07:00:00')
        const sleep = parseTime(`${nextSleep}:00`, '23:00:00')
        void scheduleNotifications(wake.hour, wake.minute, sleep.hour, sleep.minute)
      }
    }

    window.location.href = '/dashboard'
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Sleep schedule</p>

        <label style={{ display: 'block', marginBottom: 8, color: '#cfbde7' }}>Wake time</label>
        <input
          className="time-picker"
          type="time"
          step={900}
          value={wakeTime}
          onChange={(event) => {
            const next = event.target.value
            setWakeTime(next)
            void saveSchedule(next, sleepTime)
          }}
          style={{ marginBottom: 16 }}
        />

        <label style={{ display: 'block', marginBottom: 8, color: '#cfbde7' }}>Sleep time</label>
        <input
          className="time-picker"
          type="time"
          step={900}
          value={sleepTime}
          onChange={(event) => {
            const next = event.target.value
            setSleepTime(next)
            void saveSchedule(wakeTime, next)
          }}
        />

        {message ? <p style={{ color: '#cfbde7', marginTop: 10 }}>{message}</p> : null}
      </section>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Plan</p>
        <p style={{ color: '#efe8ff', marginBottom: 8 }}>
          Current: {isTrial ? 'Pro (trial)' : tier === 'pro' ? 'Pro' : 'Free'}
        </p>
        {isTrial ? (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 8 }}>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining</p>
            <p style={{ color: '#cbb7e4' }}>Pro features unlocked during your trial.</p>
          </>
        ) : tier === 'pro' ? (
          <p style={{ color: '#cbb7e4' }}>Pro features unlocked.</p>
        ) : (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 12 }}>Free includes unlimited dream journaling and archive.</p>
            <a href="https://sushankhanal.gumroad.com/l/somniavault" target="_blank" rel="noreferrer" className="btn-gold">
              Upgrade to Pro - $4.99/mo
            </a>
          </>
        )}
      </section>
    </div>
  )
}
