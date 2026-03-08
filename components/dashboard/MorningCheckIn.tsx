'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'

type WakeLog = {
  actual_wake_time: string
  minutes_from_target: number
  sleep_quality: number | null
}

type Props = {
  userId: string
  targetWakeTime: string
  initialTodayLog: WakeLog | null
}

function toMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function formatTimeLabel(time: string) {
  return new Date(`1970-01-01T${time.slice(0, 5)}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function MorningCheckIn({ userId, targetWakeTime, initialTodayLog }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [todayLog, setTodayLog] = useState<WakeLog | null>(initialTodayLog)
  const [wakeTime, setWakeTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [quality, setQuality] = useState(3)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showJournalPrompt, setShowJournalPrompt] = useState(false)

  async function submitMorning() {
    if (saving) return
    setSaving(true)

    const deviation = toMinutes(wakeTime) - toMinutes(targetWakeTime)
    const { error } = await supabase.from('wake_logs').upsert({
      user_id: userId,
      log_date: new Date().toISOString().slice(0, 10),
      actual_wake_time: `${wakeTime}:00`,
      sleep_quality: quality,
      minutes_from_target: deviation,
    })

    if (!error) {
      const nextLog = { actual_wake_time: `${wakeTime}:00`, minutes_from_target: deviation, sleep_quality: quality }
      setTodayLog(nextLog)
      const absDeviation = Math.abs(deviation)
      if (absDeviation <= 15) setFeedback('🌙 Incredible. Your body is learning.')
      else if (absDeviation <= 30) setFeedback('Getting closer. Keep going.')
      else setFeedback('Every morning counts. See you tomorrow.')

      window.setTimeout(() => setShowJournalPrompt(true), 2000)
    }

    setSaving(false)
  }

  if (todayLog) {
    return (
      <section style={{ border: '1px solid rgba(180,130,255,0.35)', background: 'rgba(122,84,204,0.14)', padding: '16px 18px', borderRadius: 12, marginBottom: 20 }}>
        <p style={{ color: '#efe5ff' }}>
          ✓ {formatTimeLabel(todayLog.actual_wake_time)} this morning
        </p>
        <p style={{ color: '#d9c6ff', marginTop: 4 }}>
          {todayLog.minutes_from_target} minutes from your target
        </p>
      </section>
    )
  }

  return (
    <section style={{ border: '1px solid rgba(180,130,255,0.35)', background: 'rgba(122,84,204,0.14)', boxShadow: '0 0 35px rgba(140,80,255,0.25)', padding: '18px', borderRadius: 14, marginBottom: 22 }}>
      <p style={{ fontSize: 24, marginBottom: 10 }}>🌙 Good morning. What time did you wake up?</p>
      <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} style={{ width: '100%', minHeight: 48, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#100a22', color: '#fff', padding: '0 10px', fontSize: 20, marginBottom: 12 }} />
      <p style={{ marginBottom: 8 }}>Sleep quality:</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} onClick={() => setQuality(rating)} style={{ fontSize: 28, color: rating <= quality ? '#d6b5ff' : '#6f5d8f' }}>
            ☽
          </button>
        ))}
      </div>
      <button className="btn-gold" onClick={submitMorning} disabled={saving} style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.75 : 1 }}>
        {saving ? 'Logging...' : 'Log Morning →'}
      </button>
      {feedback ? <p style={{ marginTop: 10, color: '#f1e7ff' }}>{feedback}</p> : null}
      {showJournalPrompt ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 8 }}>Want to record last night&apos;s dream?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/journal/new" className="btn-gold">Open Journal →</Link>
            <button className="btn-ghost-gold" onClick={() => setShowJournalPrompt(false)}>Skip</button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
