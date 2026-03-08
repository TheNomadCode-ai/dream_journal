'use client'

import Link from 'next/link'
import { toPng } from 'html-to-image'
import { useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type WakeLog = {
  actual_wake_time: string
  minutes_from_target: number
  sleep_quality: number | null
  morning_light: number | null
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
  if (streak >= 90) return 'Ninety dawns. You are operating on a trained circadian rhythm.'
  if (streak >= 60) return 'Sixty mornings in sync. This is elite consistency.'
  if (streak >= 30) return 'Thirty-day lock-in. Your clock now expects this rhythm.'
  if (streak >= 21) return 'Three weeks complete. Habit architecture is now stable.'
  if (streak >= 14) return 'Two weeks done. Your wake timing is getting sharper.'
  return 'Seven-day milestone reached. Your clock has started adapting.'
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
  const [morningLight, setMorningLight] = useState(10)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showJournalPrompt, setShowJournalPrompt] = useState(false)
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submitMorning() {
    if (saving) return
    setSaving(true)
    setError(null)
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
    const nextLog = { actual_wake_time: `${wakeTime}:00`, minutes_from_target: deviation, sleep_quality: quality, morning_light: morningLight }
    const prevState = {
      todayLog,
      currentStreak,
      lastLoggedDate,
      freezesRemaining,
      freezesResetDate,
      feedback,
      freezeMessage,
      milestone,
    }

    // Optimistic UI update for instant interaction feedback.
    setTodayLog(nextLog)
    setCurrentStreak(nextStreak)
    setLastLoggedDate(today)
    setFreezesRemaining(activeFreezes)
    setFreezesResetDate(thisMonday)

    const absDeviation = Math.abs(deviation)
    if (absDeviation <= 15 && morningLight >= 10) setFeedback('Excellent timing and light exposure. Your body clock gets a strong anchor today.')
    else if (morningLight < 10) setFeedback('Nice log. Try 10+ minutes of outdoor light within an hour of waking tomorrow.')
    else if (absDeviation <= 30) setFeedback('Getting closer. Keep this rhythm going.')
    else setFeedback('Every morning counts. Light + consistency will pull your timing in.')

    if (usedFreeze) {
      setFreezeMessage('Streak freeze used. You have 0 freezes left this week.')
    }

    if (MILESTONES.includes(nextStreak)) {
      setMilestone(nextStreak)
    }

    window.setTimeout(() => setShowJournalPrompt(true), 2000)

    void Promise.all([
      supabase.from('wake_logs').upsert({
        user_id: userId,
        log_date: today,
        actual_wake_time: `${wakeTime}:00`,
        sleep_quality: quality,
        morning_light: morningLight,
        minutes_from_target: deviation,
      }),
      supabase
        .from('profiles')
        .update({
          streak_freezes_remaining: activeFreezes,
          streak_freeze_reset_date: thisMonday,
        })
        .eq('id', userId),
    ])
      .then(([wakeResult, profileResult]) => {
        if (wakeResult.error || profileResult.error) {
          setTodayLog(prevState.todayLog)
          setCurrentStreak(prevState.currentStreak)
          setLastLoggedDate(prevState.lastLoggedDate)
          setFreezesRemaining(prevState.freezesRemaining)
          setFreezesResetDate(prevState.freezesResetDate)
          setFeedback(prevState.feedback)
          setFreezeMessage(prevState.freezeMessage)
          setMilestone(prevState.milestone)
          setShowJournalPrompt(false)
          setError('Could not save check-in. Please try again.')
        }
      })
      .finally(() => setSaving(false))
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
      <input className="time-picker" type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} style={{ width: '100%', minHeight: 48, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#100a22', color: '#fff', padding: '0 10px', fontSize: 20, marginBottom: 12 }} />
      <p style={{ marginBottom: 8 }}>Sleep quality:</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} onClick={() => setQuality(rating)} style={{ fontSize: 28, color: rating <= quality ? '#d6b5ff' : '#6f5d8f' }}>
            ☽
          </button>
        ))}
      </div>
      <p style={{ marginBottom: 8 }}>Morning outdoor light (minutes in first hour):</p>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {[
          { label: '0 to 5 min', value: 5 },
          { label: '5 to 10 min', value: 10 },
          { label: '10 to 20 min', value: 20 },
          { label: '20+ min', value: 30 },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setMorningLight(option.value)}
            style={{
              minHeight: 42,
              borderRadius: 10,
              border: `1px solid ${morningLight === option.value ? 'rgba(232,193,104,0.9)' : 'rgba(255,255,255,0.2)'}`,
              background: morningLight === option.value ? 'rgba(232,193,104,0.12)' : '#100a22',
              color: '#f3eaff',
              textAlign: 'left',
              padding: '0 12px',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button className="btn-gold" onClick={submitMorning} disabled={saving} style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.75 : 1 }}>
        {saving ? 'Logging...' : 'Log Morning →'}
      </button>
      {error ? <p style={{ marginTop: 8, color: '#ffb6b6' }}>{error}</p> : null}
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

          <div id="somnia-milestone-card" style={{ width: 'min(640px, 100%)', minHeight: 640, border: '1px solid rgba(180,130,255,0.35)', borderRadius: 16, background: 'radial-gradient(circle at 50% 0%, rgba(134,90,220,0.5), #120a25 55%)', padding: '36px 26px', textAlign: 'center', position: 'relative', display: 'grid', alignContent: 'center' }}>
            <p style={{ fontSize: 58, marginBottom: 8, filter: 'drop-shadow(0 0 16px rgba(180,130,255,0.72))' }}>🌙</p>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 54, marginBottom: 8, lineHeight: 1.05 }}>{milestone} Day Streak</h2>
            <p style={{ color: '#e5d7ff', marginBottom: 12 }}>{milestoneMessage(milestone)}</p>
            <p style={{ color: '#d2beef', marginBottom: 18 }}>I&apos;ve logged {milestone} mornings with Somnia and I&apos;m training my biological clock.</p>
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
