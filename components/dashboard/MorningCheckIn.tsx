'use client'

import Link from 'next/link'
import { toPng } from 'html-to-image'
import { useMemo, useState } from 'react'

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
  initialCurrentStreak: number
  initialLastLoggedDate: string | null
  initialFreezesRemaining: number
  initialFreezesResetDate: string | null
}

const MILESTONES = [7, 14, 21, 30, 60, 90]

function toMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function formatTimeLabel(time: string) {
  return new Date(`1970-01-01T${time.slice(0, 5)}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dayDiff(fromDate: string, toDate: string) {
  const start = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)
  const diff = end.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function mondayOfCurrentWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const delta = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + delta)
  return copy.toISOString().slice(0, 10)
}

function milestoneMessage(streak: number) {
  if (streak >= 90) return 'Legend status. Your rhythm is locked in.'
  if (streak >= 60) return 'Two months of momentum. Keep this cadence.'
  if (streak >= 30) return 'One full month of training. Incredible consistency.'
  if (streak >= 21) return 'Three-week habit formed. Your body is adapting.'
  if (streak >= 14) return 'Two weeks strong. You are getting sharper each morning.'
  return 'Week one complete. Your biological clock is waking up.'
}

export default function MorningCheckIn({
  userId,
  targetWakeTime,
  initialTodayLog,
  initialCurrentStreak,
  initialLastLoggedDate,
  initialFreezesRemaining,
  initialFreezesResetDate,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [todayLog, setTodayLog] = useState<WakeLog | null>(initialTodayLog)
  const [currentStreak, setCurrentStreak] = useState(initialCurrentStreak)
  const [lastLoggedDate, setLastLoggedDate] = useState<string | null>(initialLastLoggedDate)
  const [freezesRemaining, setFreezesRemaining] = useState(initialFreezesRemaining)
  const [freezesResetDate, setFreezesResetDate] = useState<string | null>(initialFreezesResetDate)
  const [wakeTime, setWakeTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [quality, setQuality] = useState(3)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showJournalPrompt, setShowJournalPrompt] = useState(false)
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)

  async function submitMorning() {
    if (saving) return
    setSaving(true)
    setFreezeMessage(null)

    const today = new Date().toISOString().slice(0, 10)
    const thisMonday = mondayOfCurrentWeek(new Date())
    let activeFreezes = freezesRemaining

    if (!freezesResetDate || freezesResetDate !== thisMonday) {
      activeFreezes = 1
      setFreezesRemaining(1)
      setFreezesResetDate(thisMonday)
    }

    let nextStreak = currentStreak || 0
    let usedFreeze = false

    if (!lastLoggedDate) {
      nextStreak = 1
    } else {
      const diff = dayDiff(lastLoggedDate, today)
      if (diff <= 0) {
        nextStreak = currentStreak || 1
      } else if (diff === 1) {
        nextStreak = currentStreak + 1
      } else if (diff === 2 && activeFreezes > 0) {
        usedFreeze = true
        activeFreezes -= 1
        nextStreak = currentStreak + 1
      } else {
        nextStreak = 1
      }
    }

    const deviation = toMinutes(wakeTime) - toMinutes(targetWakeTime)
    const { error } = await supabase.from('wake_logs').upsert({
      user_id: userId,
      log_date: today,
      actual_wake_time: `${wakeTime}:00`,
      sleep_quality: quality,
      minutes_from_target: deviation,
    })

    if (!error) {
      await supabase
        .from('user_profiles')
        .update({
          current_streak: nextStreak,
          last_logged_date: today,
          streak_freezes_remaining: activeFreezes,
          streak_freezes_reset_date: thisMonday,
        })
        .eq('id', userId)

      const nextLog = { actual_wake_time: `${wakeTime}:00`, minutes_from_target: deviation, sleep_quality: quality }
      setTodayLog(nextLog)
      setCurrentStreak(nextStreak)
      setLastLoggedDate(today)
      setFreezesRemaining(activeFreezes)

      const absDeviation = Math.abs(deviation)
      if (absDeviation <= 15) setFeedback('🌙 Incredible. Your body is learning.')
      else if (absDeviation <= 30) setFeedback('Getting closer. Keep going.')
      else setFeedback('Every morning counts. See you tomorrow.')

      if (usedFreeze) {
        setFreezeMessage('Streak freeze used. You have 0 freezes left this week.')
      }

      if (MILESTONES.includes(nextStreak)) {
        setMilestone(nextStreak)
      }

      window.setTimeout(() => setShowJournalPrompt(true), 2000)
    }

    setSaving(false)
  }

  async function shareMilestone() {
    const card = document.getElementById('somnia-milestone-card')
    if (!card || !milestone) return
    const dataUrl = await toPng(card, { cacheBust: true })
    const link = document.createElement('a')
    link.download = `somnia-${milestone}-day-streak.png`
    link.href = dataUrl
    link.click()
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
      {freezeMessage ? <p style={{ marginTop: 6, color: '#e8ccff' }}>{freezeMessage}</p> : null}
      {showJournalPrompt ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 8 }}>Want to record last night&apos;s dream?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/journal/new" className="btn-gold">Open Journal →</Link>
            <button className="btn-ghost-gold" onClick={() => setShowJournalPrompt(false)}>Skip</button>
          </div>
        </div>
      ) : null}

      {milestone ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(6,4,15,0.9)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {Array.from({ length: 70 }).map((_, index) => (
              <span
                key={index}
                style={{
                  position: 'absolute',
                  top: -20,
                  left: `${(index * 13) % 100}%`,
                  width: 7,
                  height: 14,
                  borderRadius: 2,
                  background: index % 2 === 0 ? 'rgba(180,130,255,0.92)' : 'rgba(232,193,104,0.9)',
                  animation: `confettiFall ${2 + (index % 4) * 0.5}s linear infinite`,
                  animationDelay: `${(index % 10) * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div id="somnia-milestone-card" style={{ width: 'min(580px, 100%)', border: '1px solid rgba(180,130,255,0.35)', borderRadius: 16, background: 'radial-gradient(circle at 50% 0%, rgba(134,90,220,0.5), #120a25 55%)', padding: '30px 24px', textAlign: 'center', position: 'relative' }}>
            <p style={{ fontSize: 58, marginBottom: 8, filter: 'drop-shadow(0 0 16px rgba(180,130,255,0.72))' }}>🌙</p>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 54, marginBottom: 8 }}>{milestone} Day Streak 🔥</h2>
            <p style={{ color: '#e5d7ff', marginBottom: 12 }}>{milestoneMessage(milestone)}</p>
            <p style={{ color: '#d2beef', marginBottom: 18 }}>I&apos;ve logged {milestone} mornings with Somnia</p>
            <p style={{ color: '#beabd9' }}>somniavault.me</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
              <button className="btn-gold" onClick={shareMilestone}>Share →</button>
              <button className="btn-ghost-gold" onClick={() => setMilestone(null)}>Continue</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
