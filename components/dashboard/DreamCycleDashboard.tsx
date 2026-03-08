'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { computeLoopStreak, minusMinutes, parseTime, windowForToday } from '@/lib/dream-cycle'

type Seed = {
  id: string
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  morning_confirmed_at: string | null
  dream_entry_id: string | null
}

type Dream = {
  id: string
  title: string | null
  body_text: string | null
  date_of_dream: string
}

type ArchiveSeed = {
  dream_entry_id: string | null
  seed_text: string
  was_dreamed: boolean | null
}

type Props = {
  wakeTime: string
  sleepTime: string
  todaySeed: Seed | null
  yesterdaySeed: Seed | null
  recentSeeds: Seed[]
  dreams: Dream[]
  archiveSeeds: ArchiveSeed[]
  totalSeedsPlanted: number
  totalSeedsDreamed: number
  showNotificationReminderBanner: boolean
}

function firstLine(value: string | null) {
  if (!value) return 'No journal body.'
  const line = value.split('\n')[0] ?? ''
  return line.trim() || 'No journal body.'
}

const MILESTONES = new Map<number, string>([
  [7, 'One week. Your subconscious is listening.'],
  [14, 'Two weeks. Patterns are forming.'],
  [21, 'Three weeks. This is becoming natural.'],
  [30, 'Thirty days. Your dream life is changing.'],
  [60, 'Sixty days. Most people never get here.'],
  [90, 'Ninety days. You have changed how you sleep.'],
])

export default function DreamCycleDashboard({
  wakeTime,
  sleepTime,
  todaySeed,
  yesterdaySeed,
  recentSeeds,
  dreams,
  archiveSeeds,
  totalSeedsPlanted,
  totalSeedsDreamed,
  showNotificationReminderBanner,
}: Props) {
  const router = useRouter()
  const [showMilestone, setShowMilestone] = useState(false)
  const [now, setNow] = useState(new Date())

  const wake = parseTime(wakeTime, '07:00:00')
  const sleep = parseTime(sleepTime, '23:00:00')
  const evening = minusMinutes(sleep.hour, sleep.minute, 10)

  const morningWindow = windowForToday(wake.hour, wake.minute, 5)
  const eveningWindow = windowForToday(evening.hour, evening.minute, 10)

  const nowTotal = now.getHours() * 60 + now.getMinutes()
  const [sleepH, sleepM] = sleepTime.split(':').map(Number)
  const sleepTotal = sleepH * 60 + sleepM
  const windowStart = sleepTotal - 10
  const windowEnd = sleepTotal
  const minutesRemaining = Math.max(0, windowEnd - nowTotal)

  function formatTime(totalMins: number) {
    let h = Math.floor(totalMins / 60)
    let m = totalMins % 60
    if (h >= 24) h -= 24
    if (h < 0) h += 24
    if (m < 0) m += 60
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    const displayM = m.toString().padStart(2, '0')
    return `${displayH}:${displayM} ${period}`
  }

  const windowStartFormatted = formatTime(windowStart)

  const streak = computeLoopStreak(recentSeeds.map((seed) => ({ seed_date: seed.seed_date, morning_confirmed_at: seed.morning_confirmed_at })))
  const successRate = totalSeedsPlanted > 0 ? Math.round((totalSeedsDreamed / totalSeedsPlanted) * 100) : 0

  const state = useMemo(() => {
    if (morningWindow.isOpen && yesterdaySeed && !yesterdaySeed.morning_confirmed_at) return 'MORNING_OPEN'
    if (todaySeed && !morningWindow.isOpen) return 'SEED_PLANTED'
    if (eveningWindow.isOpen && !todaySeed && (!yesterdaySeed || Boolean(yesterdaySeed.morning_confirmed_at))) return 'EVENING_OPEN'
    if (yesterdaySeed?.morning_confirmed_at) return 'MORNING_CONFIRMED'
    return 'BEFORE_EVENING'
  }, [eveningWindow.isOpen, morningWindow.isOpen, todaySeed, yesterdaySeed])

  useEffect(() => {
    console.log('[Dashboard] Current state:', state)
    console.log('[Dashboard] Today seed:', todaySeed)
    console.log('[Dashboard] Streak:', streak)
  }, [state, streak, todaySeed])

  useEffect(() => {
    if (!MILESTONES.has(streak)) return
    const key = `somnia-milestone:${streak}`
    const seen = localStorage.getItem(key)
    if (!seen) {
      setShowMilestone(true)
      localStorage.setItem(key, '1')
    }
  }, [streak])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 30000)
    return () => window.clearInterval(interval)
  }, [])

  const archiveByDream = new Map(archiveSeeds.map((item) => [item.dream_entry_id, item]))

  return (
    <div className="page-enter" style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 120px' }}>
      {showNotificationReminderBanner ? (
        <section style={{ border: '1px solid rgba(201,168,76,0.45)', borderRadius: 12, background: 'rgba(201,168,76,0.06)', padding: 14, marginBottom: 12 }}>
          <p style={{ color: '#e9defa', marginBottom: 6 }}>Notifications are still off.</p>
          <p style={{ color: '#c9a84c' }}>Use your browser settings to enable notifications.</p>
        </section>
      ) : null}

      <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18, marginBottom: 18 }}>
        {todaySeed ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Tonight's seed is planted.</p>
            <p style={{ color: '#cdbde7' }}>Morning window opens at {formatTime(wake.hour * 60 + wake.minute)}.</p>
          </>
        ) : null}

        {!todaySeed && nowTotal < windowStart ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 8 }}>Tonight's planting window opens at {windowStartFormatted}</p>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, 100 - Math.max(0, nowTotal < windowStart ? windowStart - nowTotal : 0) / 10))}%`, background: '#c9a84c' }} />
            </div>
          </>
        ) : null}

        {!todaySeed && nowTotal >= windowStart && nowTotal <= windowEnd ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 8 }}>Your planting window is open.</p>
            <p style={{ color: '#cdbde7', marginBottom: 12 }}>{minutesRemaining} minutes remaining</p>
            <button className="btn-gold" onClick={() => router.push('/evening')}>Plant Tonight's Seed</button>
          </>
        ) : null}

        {!todaySeed && nowTotal > windowEnd ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Tonight's window opened at {windowStartFormatted} and has closed.</p>
            <p style={{ color: '#cdbde7' }}>Opens again tomorrow at {windowStartFormatted}.</p>
          </>
        ) : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
        <article style={{ border: '1px solid #2a1f45', borderRadius: 12, background: '#100a22', padding: 14 }}>
          <p style={{ textTransform: 'uppercase', fontSize: 11, color: '#9f8abb', letterSpacing: '0.12em' }}>Streak</p>
          <p style={{ fontSize: 32, marginTop: 4 }}>{streak}</p>
          <p style={{ color: '#bca7de', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{streak} day streak</p>
        </article>
        <article style={{ border: '1px solid #2a1f45', borderRadius: 12, background: '#100a22', padding: 14 }}>
          <p style={{ textTransform: 'uppercase', fontSize: 11, color: '#9f8abb', letterSpacing: '0.12em' }}>Success</p>
          <p style={{ fontSize: 32, marginTop: 4 }}>{successRate}%</p>
          <p style={{ color: '#bca7de', fontSize: 12 }}>dreamed</p>
        </article>
        <article style={{ border: '1px solid #2a1f45', borderRadius: 12, background: '#100a22', padding: 14 }}>
          <p style={{ textTransform: 'uppercase', fontSize: 11, color: '#9f8abb', letterSpacing: '0.12em' }}>Seeds</p>
          <p style={{ fontSize: 32, marginTop: 4 }}>{totalSeedsPlanted}</p>
          <p style={{ color: '#bca7de', fontSize: 12 }}>planted</p>
        </article>
      </section>

      <section>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a993cd', fontSize: 11, marginBottom: 10 }}>Dream archive</p>
        {!dreams.length ? (
          <div style={{ border: '1px solid #2a1f45', borderRadius: 12, background: '#100a22', padding: 18 }}>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>No dreams recorded yet.</p>
            <p style={{ color: '#bca7de' }}>Your archive builds every morning.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid #2a1f45', borderRadius: 12, overflow: 'hidden' }}>
            {dreams.map((dream) => {
              const seed = archiveByDream.get(dream.id)
              const appearedText = seed?.was_dreamed === true ? 'Yes' : seed?.was_dreamed === false ? 'No' : 'Unconfirmed'
              return (
                <Link key={dream.id} href={`/dreams/${dream.id}`} style={{ display: 'block', background: '#100a22', borderBottom: '1px solid #231840', padding: 14 }}>
                  <div>
                    <p style={{ color: '#a993cd', fontSize: 12, marginBottom: 8 }}>{dream.date_of_dream}</p>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', marginBottom: 10 }} />
                    <p style={{ color: '#ccb7eb', fontSize: 12, marginBottom: 2 }}>Seed: {seed?.seed_text ?? 'No seed linked'}</p>
                    <p style={{ color: '#b9acd1', fontSize: 12, marginBottom: 8 }}>Appeared: {appearedText}</p>
                    <p style={{ color: '#bca7de', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{firstLine(dream.body_text)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {showMilestone ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,0.92)', display: 'grid', placeItems: 'center', zIndex: 90, padding: 24 }}>
          <div style={{ width: 'min(620px, 100%)', background: '#100a22', border: '1px solid #2a1f45', borderRadius: 16, padding: 26, textAlign: 'center' }}>
            <p style={{ fontSize: 70, lineHeight: 1 }}>{streak}</p>
            <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4c0ef', marginBottom: 10 }}>{streak} day streak</p>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', color: '#e8dcf7', marginBottom: 16 }}>{MILESTONES.get(streak)}</p>
            <div style={{ border: '1px solid #2a1f45', borderRadius: 10, padding: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 38, lineHeight: 1 }}>{streak}</p>
              <p style={{ color: '#d4c0ef' }}>day streak</p>
              <p style={{ color: '#9f8abb' }}>somniavault.me</p>
            </div>
            <button className="btn-gold" onClick={() => setShowMilestone(false)}>Continue</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
