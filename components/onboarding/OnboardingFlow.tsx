'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { scheduleWakeNotification, scheduleWindDownNotification } from '@/lib/notifications'

function toLocalTimeString(value: string) {
  return value.slice(0, 5)
}

function toWakeTimeWithSeconds(value: string) {
  return `${value}:00`
}

function recommendedBedtime(wakeTime: string) {
  const [h, m] = wakeTime.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  date.setHours(date.getHours() - 8)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function makeTimeOptions() {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    }
  }
  return options
}

type Props = {
  initialWakeTime: string
  initialSleepTime: string
}

export default function OnboardingFlow({ initialWakeTime }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [screen, setScreen] = useState<1 | 2>(1)
  const [wakeTime, setWakeTime] = useState(toLocalTimeString(initialWakeTime || '07:00:00'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => makeTimeOptions(), [])

  async function saveTarget() {
    if (saving) return
    setSaving(true)
    setError(null)

    const bedtime = recommendedBedtime(wakeTime)
    const bedtimeDate = new Date(`1970-01-01T${wakeTime}:00`)
    bedtimeDate.setHours(bedtimeDate.getHours() - 8)
    const bedtimeTime = `${String(bedtimeDate.getHours()).padStart(2, '0')}:${String(bedtimeDate.getMinutes()).padStart(2, '0')}:00`

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      setSaving(false)
      setError('Please sign in again.')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        target_wake_time: toWakeTimeWithSeconds(wakeTime),
        target_sleep_time: bedtimeTime,
        onboarding_complete: true,
      })
      .eq('id', userId)

    if (updateError) {
      setSaving(false)
      setError('Could not save your target right now.')
      return
    }

    const [hour, minute] = wakeTime.split(':').map(Number)
    await scheduleWakeNotification(hour, minute)
    await scheduleWindDownNotification(bedtimeDate.getHours(), bedtimeDate.getMinutes())
    void bedtime

    router.replace('/install')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06040f', color: '#f4eeff', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ width: 'min(680px, 100%)', border: '1px solid rgba(180,130,255,0.28)', background: 'rgba(14,10,30,0.72)', borderRadius: 18, padding: '30px 24px' }}>
        {screen === 1 ? (
          <>
            <p style={{ fontSize: 26, marginBottom: 8 }}>🌙 Somnia</p>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12, color: 'rgba(232,214,255,0.75)', marginBottom: 16 }}>
              Your body already knows.
            </p>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 31, lineHeight: 1.35, color: '#efe4ff', marginBottom: 28 }}>
              Most people rely on alarms because they have never given their body a chance to learn. Somnia tracks your natural wake patterns every morning. Within 30 days most users wake within 10 minutes of their target naturally.
            </p>
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setScreen(2)}>
              Begin Training →
            </button>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12, color: 'rgba(232,214,255,0.75)', marginBottom: 10 }}>
              When do you want to wake up?
            </p>
            <p style={{ color: 'rgba(242,234,255,0.78)', marginBottom: 16 }}>
              This is your goal, not an alarm. Your body will learn this time.
            </p>

            <select
              value={wakeTime}
              onChange={(event) => setWakeTime(event.target.value)}
              style={{ width: '100%', minHeight: 56, borderRadius: 12, background: '#120d24', border: '1px solid rgba(180,130,255,0.35)', color: '#f7f2ff', padding: '0 12px', fontSize: 20, marginBottom: 12 }}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {new Date(`1970-01-01T${option}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </option>
              ))}
            </select>

            <p style={{ color: '#d7c3ff', marginBottom: 20 }}>
              Recommended bedtime: {recommendedBedtime(wakeTime)}
            </p>

            {error ? <p style={{ color: '#ff92ad', marginBottom: 10 }}>{error}</p> : null}

            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.75 : 1 }} onClick={saveTarget} disabled={saving}>
              {saving ? 'Saving...' : 'Set My Target →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
