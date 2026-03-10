'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getAllSeeds, getDreamByDate, type DreamEntry, type SeedEntry } from '@/lib/local-db'

type Props = {
  wakeTime: string
  sleepTime: string
  dreams: DreamEntry[]
  seeds: SeedEntry[]
  streak: number
  successRate: number
  totalSeeds: number
  showNotificationReminderBanner: boolean
}

function firstLine(value: string) {
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
  dreams,
  seeds,
  streak,
  successRate,
  totalSeeds,
  showNotificationReminderBanner,
}: Props) {
  const router = useRouter()
  const [showMilestone, setShowMilestone] = useState(false)
  const [now, setNow] = useState(new Date())
  const [showSeedHistory, setShowSeedHistory] = useState(false)
  const [seedHistory, setSeedHistory] = useState<Array<SeedEntry & { hasDream: boolean }>>([])
  const [seedHistoryLoading, setSeedHistoryLoading] = useState(false)

  const nowTotal = now.getHours() * 60 + now.getMinutes()
  const [sleepH, sleepM] = sleepTime.split(':').map(Number)
  const sleepTotal = sleepH * 60 + sleepM
  const eveningWindowStart = sleepTotal - 10

  const [wakeH, wakeM] = wakeTime.split(':').map(Number)
  const wakeTotal = wakeH * 60 + wakeM
  const morningWindowStart = wakeTotal - 120
  const morningWindowEnd = wakeTotal
  const eveningWindowEnd = sleepTotal

  function normalizeMinutes(total: number) {
    const day = 24 * 60
    return ((total % day) + day) % day
  }

  function isWithinWindow(current: number, start: number, end: number) {
    const currentNorm = normalizeMinutes(current)
    const startNorm = normalizeMinutes(start)
    const endNorm = normalizeMinutes(end)
    if (startNorm <= endNorm) {
      return currentNorm >= startNorm && currentNorm <= endNorm
    }
    return currentNorm >= startNorm || currentNorm <= endNorm
  }

  const inMorningWindow = isWithinWindow(nowTotal, morningWindowStart, morningWindowEnd)
  const inEveningWindow = isWithinWindow(nowTotal, eveningWindowStart, eveningWindowEnd)

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
  const morningWindowEndFormatted = formatTime(morningWindowEnd)

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

  const today = new Date().toISOString().split('T')[0]
  const morningDone = localStorage.getItem('somnia_morning_entry_date') === today
  const seedPlanted = localStorage.getItem('somnia_seed_planted_date') === today

  type WindowCardState = {
    title: string
    subtitle?: string
    muted?: string
    cta?: {
      label: string
      href: '/morning' | '/evening'
    }
  }

  const nowNorm = normalizeMinutes(nowTotal)
  const eveningStartNorm = normalizeMinutes(eveningWindowStart)

  let windowCard: WindowCardState

  if (seedPlanted && !morningDone && inMorningWindow) {
    windowCard = {
      title: 'Your morning window is open.',
      subtitle: "Time to capture last night's dream.",
      cta: { label: 'Capture Dream ->', href: '/morning' },
    }
  } else if (inMorningWindow && !morningDone) {
    windowCard = {
      title: 'Morning window is open.',
      subtitle: 'Capture your dream now.',
      cta: { label: 'Capture Dream ->', href: '/morning' },
    }
  } else if (inEveningWindow && !seedPlanted) {
    const minutesRemaining = Math.max(0, eveningWindowEnd - nowTotal)
    windowCard = {
      title: 'Your planting window is open.',
      subtitle: `${minutesRemaining} minutes remaining`,
      cta: { label: "Plant Tonight's Seed ->", href: '/evening' },
    }
  } else if (morningDone && nowNorm < eveningStartNorm && !seedPlanted) {
    const minsUntilEvening = eveningStartNorm - nowNorm
    const hoursUntil = Math.floor(minsUntilEvening / 60)
    const minsUntil = minsUntilEvening % 60
    windowCard = {
      title: 'Dream captured.',
      subtitle: `Evening window opens at ${eveningWindowStartFormatted}`,
      muted: hoursUntil > 0 ? `in ${hoursUntil}h ${minsUntil}m` : `in ${minsUntil} minutes`,
    }
  } else if (!inMorningWindow && !inEveningWindow && seedPlanted && !morningDone) {
    windowCard = {
      title: "Tonight's seed is planted.",
      subtitle: `Morning window: ${morningWindowStartFormatted} - ${morningWindowEndFormatted}`,
      muted: 'Sleep well.',
    }
  } else if (!inMorningWindow && !morningDone && nowNorm > normalizeMinutes(morningWindowEnd) && nowNorm < eveningStartNorm && !seedPlanted) {
    windowCard = {
      title: 'Morning window has closed.',
      subtitle: `Evening window opens at ${eveningWindowStartFormatted}`,
    }
  } else {
    windowCard = {
      title: 'Tonight\'s next step is waiting.',
      subtitle: `Evening window opens at ${eveningWindowStartFormatted}`,
    }
  }

  const seedByDate = new Map(seeds.map((seed) => [seed.date, seed]))

  function formatSeedDate(value: string) {
    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  async function openSeedHistory() {
    setShowSeedHistory(true)
    setSeedHistoryLoading(true)
    try {
      const allSeeds = await getAllSeeds()
      const rows = await Promise.all(
        allSeeds.map(async (seed) => {
          const dream = await getDreamByDate(seed.date)
          return {
            ...seed,
            hasDream: dream !== null,
          }
        }),
      )
      setSeedHistory(rows)
    } finally {
      setSeedHistoryLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 120px' }}>
      {showNotificationReminderBanner ? (
        <section style={{ border: '1px solid rgba(201,168,76,0.45)', borderRadius: 12, background: 'rgba(201,168,76,0.06)', padding: 14, marginBottom: 12 }}>
          <p style={{ color: '#e9defa', marginBottom: 6 }}>Notifications are still off.</p>
          <p style={{ color: '#c9a84c' }}>Use your browser settings to enable notifications.</p>
        </section>
      ) : null}

      <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18, marginBottom: 18 }}>
        <p style={{ color: '#efe8ff', marginBottom: 6 }}>{windowCard.title}</p>
        {windowCard.subtitle ? <p style={{ color: '#cdbde7', marginBottom: windowCard.cta ? 12 : 0 }}>{windowCard.subtitle}</p> : null}
        {windowCard.muted ? <p style={{ color: '#9f8abb', fontSize: 13, marginTop: 8 }}>{windowCard.muted}</p> : null}
        {windowCard.cta ? (
          <button className="btn-gold" onClick={() => router.push(windowCard.cta!.href)}>{windowCard.cta.label}</button>
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
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <p style={{ fontSize: 32 }}>{totalSeeds}</p>
            <button
              type="button"
              onClick={() => {
                void openSeedHistory()
              }}
              style={{
                border: '1px solid #4a3a6d',
                background: 'transparent',
                color: '#d6c7ef',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              View
            </button>
          </div>
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
              const seed = seedByDate.get(dream.date) ?? null
              const appearedText = seed?.wasDreamed === true ? 'Yes' : seed?.wasDreamed === false ? 'No' : 'Unconfirmed'
              return (
                <article key={dream.id} style={{ background: '#100a22', borderBottom: '1px solid #231840', padding: 14 }}>
                  <p style={{ color: '#a993cd', fontSize: 12, marginBottom: 8 }}>{dream.date}</p>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', marginBottom: 10 }} />
                  {seed ? (
                    <>
                      <p style={{ color: '#ccb7eb', fontSize: 12, marginBottom: 2 }}>Seed: {seed.seedText}</p>
                      <p style={{ color: '#b9acd1', fontSize: 12, marginBottom: 8 }}>Appeared: {appearedText}</p>
                    </>
                  ) : (
                    <p style={{ color: '#ccb7eb', fontSize: 12, marginBottom: 8 }}>Seed: No seed linked</p>
                  )}
                  <p style={{ color: '#bca7de', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{firstLine(dream.content)}</p>
                </article>
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

      {showSeedHistory ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 91 }}>
          <button
            type="button"
            aria-label="Close seed history"
            onClick={() => setShowSeedHistory(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(5,3,13,0.82)', border: 0 }}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Planted seeds"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '86vh',
              overflowY: 'auto',
              background: '#0e0820',
              borderTop: '1px solid #2a1f45',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '16px 16px 24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d7c9ee', fontSize: 12 }}>Planted seeds</p>
              <button
                type="button"
                onClick={() => setShowSeedHistory(false)}
                style={{ border: 0, background: 'transparent', color: '#bca7de', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >
                X
              </button>
            </div>

            {seedHistoryLoading ? (
              <p style={{ color: '#b9acd1' }}>Loading seeds...</p>
            ) : seedHistory.length === 0 ? (
              <p style={{ color: '#b9acd1' }}>No seeds planted yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {seedHistory.map((seed) => (
                  <article key={seed.id} style={{ border: '1px solid #2a1f45', borderRadius: 12, background: '#100a22', padding: 14 }}>
                    <p style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: '#8e7cae', marginBottom: 10 }}>
                      {formatSeedDate(seed.date)}
                    </p>
                    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                      "{seed.seedText}"
                    </p>
                    {seed.morningEntryWritten ? (
                      <p style={{ color: '#7de8ad', fontSize: 13, marginBottom: 8 }}>✓ Dream captured</p>
                    ) : (
                      <p style={{ color: '#8f84a5', fontSize: 13, marginBottom: 8 }}>- Dream not entered</p>
                    )}

                    {seed.wasDreamed !== null ? (
                      <p style={{ color: '#b9acd1', fontSize: 12, marginBottom: 6 }}>
                        Appeared in dream: {seed.wasDreamed ? 'Yes' : 'No'}
                      </p>
                    ) : null}

                    {seed.wasDreamed === true ? (
                      <p style={{ color: '#c9a84c', fontSize: 12 }}>Appeared ✓</p>
                    ) : seed.wasDreamed === false ? (
                      <p style={{ color: '#8f84a5', fontSize: 12 }}>Did not appear</p>
                    ) : seed.hasDream ? (
                      <p style={{ color: '#8f84a5', fontSize: 12 }}>Dream exists for this date</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
