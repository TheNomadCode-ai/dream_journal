'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { computeLoopStreak } from '@/lib/dream-cycle'

type Seed = {
  id: string
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  morning_confirmed_at: string | null
  morning_entry_written: boolean
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
  morning_entry_written: boolean
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

  const nowTotal = now.getHours() * 60 + now.getMinutes()
  const [sleepH, sleepM] = sleepTime.split(':').map(Number)
  const sleepTotal = sleepH * 60 + sleepM
  const eveningWindowStart = sleepTotal - 10

  const [wakeH, wakeM] = wakeTime.split(':').map(Number)
  const wakeTotal = wakeH * 60 + wakeM
  const morningWindowStart = wakeTotal - 120
  const morningWindowEnd = wakeTotal
  const morningWindowAvailable = nowTotal >= morningWindowStart && nowTotal <= morningWindowEnd
  const morningEntryWritten = Boolean(yesterdaySeed?.morning_entry_written)

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

  const eveningWindowStartFormatted = formatTime(eveningWindowStart)
  const morningWindowStartFormatted = formatTime(morningWindowStart)

  const streak = computeLoopStreak(recentSeeds.map((seed) => ({ seed_date: seed.seed_date, morning_confirmed_at: seed.morning_confirmed_at })))
  const successRate = totalSeedsPlanted > 0 ? Math.round((totalSeedsDreamed / totalSeedsPlanted) * 100) : 0

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
        {!morningEntryWritten && nowTotal < morningWindowStart ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Morning window opens at {morningWindowStartFormatted}</p>
            <p style={{ color: '#cdbde7' }}>Capture opens 2 hours before your wake time.</p>
          </>
        ) : null}

        {!morningEntryWritten && morningWindowAvailable ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Your morning window is open.</p>
            <p style={{ color: '#cdbde7', marginBottom: 12 }}>Capture your dream before it fades.</p>
            <button className="btn-gold" onClick={() => router.push('/morning')}>Capture Now -&gt;</button>
          </>
        ) : null}

        {morningEntryWritten ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Dream captured.</p>
            <p style={{ color: '#cdbde7' }}>Tonight&apos;s window opens at {eveningWindowStartFormatted}.</p>
          </>
        ) : null}

        {!morningEntryWritten && nowTotal > morningWindowEnd ? (
          <>
            <p style={{ color: '#efe8ff', marginBottom: 6 }}>Morning window has closed.</p>
            <p style={{ color: '#cdbde7' }}>Try again tomorrow at {morningWindowStartFormatted}.</p>
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
              const isLocked = seed ? !seed.morning_entry_written : false
              const appearedText = seed?.was_dreamed === true ? 'Yes' : seed?.was_dreamed === false ? 'No' : 'Unconfirmed'
              return (
                <Link key={dream.id} href={`/dreams/${dream.id}`} style={{ display: 'block', background: '#100a22', borderBottom: '1px solid #231840', padding: 14 }}>
                  <div>
                    <p style={{ color: '#a993cd', fontSize: 12, marginBottom: 8 }}>{dream.date_of_dream}</p>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', marginBottom: 10 }} />
                    {seed ? (
                      isLocked ? (
                        <>
                          <p style={{ color: '#9f8abb', fontSize: 12, marginBottom: 2 }}>Seed: Seed sealed until morning entry</p>
                          <p style={{ color: '#8d7ba8', fontSize: 12, marginBottom: 8 }}>Appeared: Locked</p>
                        </>
                      ) : (
                        <>
                          <p style={{ color: '#ccb7eb', fontSize: 12, marginBottom: 2 }}>Seed: {seed.seed_text}</p>
                          <p style={{ color: '#b9acd1', fontSize: 12, marginBottom: 8 }}>Appeared: {appearedText}</p>
                        </>
                      )
                    ) : (
                      <p style={{ color: '#ccb7eb', fontSize: 12, marginBottom: 8 }}>Seed: No seed linked</p>
                    )}
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
