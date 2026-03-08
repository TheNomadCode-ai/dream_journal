'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { computeLoopStreak, formatClock, minusMinutes, parseTime, windowForToday } from '@/lib/dream-cycle'

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
}: Props) {
  const [showMilestone, setShowMilestone] = useState(false)

  const wake = parseTime(wakeTime, '07:00:00')
  const sleep = parseTime(sleepTime, '23:00:00')
  const evening = minusMinutes(sleep.hour, sleep.minute, 30)

  const morningWindow = windowForToday(wake.hour, wake.minute, 5)
  const eveningWindow = windowForToday(evening.hour, evening.minute, 5)

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

  const archiveByDream = new Map(archiveSeeds.map((item) => [item.dream_entry_id, item]))

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 120px' }}>
      <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18, marginBottom: 18 }}>
        {state === 'BEFORE_EVENING' ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 8 }}>Tonight's planting window opens at {formatClock(evening.hour, evening.minute)}</p>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, 100 - Math.max(0, eveningWindow.minutesUntilOpen) / 10))}%`, background: '#c9a84c' }} />
            </div>
          </>
        ) : null}

        {state === 'EVENING_OPEN' ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 8 }}>Your planting window is open.</p>
            <p style={{ color: '#cdbde7', marginBottom: 12 }}>{eveningWindow.minutesRemaining} minutes remaining</p>
            <Link className="btn-gold" href="/evening">Plant Tonight's Seed</Link>
          </>
        ) : null}

        {state === 'SEED_PLANTED' && todaySeed ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Seed planted for tonight.</p>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', color: '#d9c8f2', marginBottom: 8 }}>&quot;{todaySeed.seed_text}&quot;</p>
            <p style={{ color: '#cdbde7' }}>Morning window opens at {formatClock(wake.hour, wake.minute)}</p>
          </>
        ) : null}

        {state === 'MORNING_OPEN' ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 8 }}>Your dream window is open.</p>
            <p style={{ color: '#cdbde7', marginBottom: 12 }}>{morningWindow.minutesRemaining} minutes remaining</p>
            <Link className="btn-gold" href="/morning">Capture Now</Link>
          </>
        ) : null}

        {state === 'MORNING_CONFIRMED' && yesterdaySeed ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>{formatClock(wake.hour, wake.minute)} - confirmed</p>
            <p style={{ color: '#d9c8f2', marginBottom: 2 }}>Seed: {yesterdaySeed.seed_text}</p>
            <p style={{ color: '#cdbde7' }}>{yesterdaySeed.was_dreamed ? 'appeared' : yesterdaySeed.was_dreamed === false ? "didn't appear" : 'no recall'}</p>
          </>
        ) : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
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
              return (
                <Link key={dream.id} href={`/dreams/${dream.id}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, background: '#100a22', borderBottom: '1px solid #231840', padding: 14 }}>
                  <div>
                    <p style={{ color: '#a993cd', fontSize: 12 }}>{dream.date_of_dream}</p>
                    <p style={{ color: seed?.was_dreamed ? '#9be2b0' : '#9492a2', fontSize: 12 }}>{seed?.was_dreamed ? 'appeared' : "didn't"}</p>
                  </div>
                  <div>
                    <p style={{ color: '#e9defa', marginBottom: 4 }}>{seed?.seed_text ?? 'No seed linked'}</p>
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
