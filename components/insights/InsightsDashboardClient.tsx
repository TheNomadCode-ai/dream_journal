'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Dream, DreamListResponse } from '@/types/dream'

type InsightsDashboardClientProps = {
  isPro: boolean
}

type ApiDream = Dream & {
  dream_tags?: Array<{ tags: { id: string; name: string } | { id: string; name: string }[] | null }>
}

type MoodPoint = {
  date: string
  label: string
  mood: number | null
}

type TagStat = {
  id: string
  name: string
  count: number
}

function asDateOnly(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00`)
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysBetween(a: string, b: string): number {
  const aDate = asDateOnly(a)
  const bDate = asDateOnly(b)
  const diffMs = Math.abs(aDate.getTime() - bDate.getTime())
  return Math.round(diffMs / 86400000)
}

function getDayKeysLast30(): string[] {
  const days: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    days.push(d.toISOString().slice(0, 10))
  }

  return days
}

function extractTags(dream: ApiDream): Array<{ id: string; name: string }> {
  const tags: Array<{ id: string; name: string }> = []

  for (const row of dream.dream_tags ?? []) {
    const value = row.tags
    if (!value) continue

    const set = Array.isArray(value) ? value : [value]
    for (const tag of set) {
      if (!tags.some((existing) => existing.id === tag.id)) {
        tags.push({ id: tag.id, name: tag.name })
      }
    }
  }

  return tags
}

function StatCard({
  value,
  label,
  subtext,
  color,
  icon,
}: {
  value: string
  label: string
  subtext?: string
  color?: string
  icon: ReactNode
}) {
  return (
    <article
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {label}
        </p>
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{icon}</span>
      </div>
      <p style={{ fontSize: 36, fontWeight: 700, color: color ?? '#FFFFFF', lineHeight: 1.1 }}>{value}</p>
      {subtext ? (
        <p style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{subtext}</p>
      ) : null}
    </article>
  )
}

function SectionSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="shimmer"
      style={{
        height,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
      }}
    />
  )
}

export default function InsightsDashboardClient({ isPro }: InsightsDashboardClientProps) {
  const [dreams, setDreams] = useState<ApiDream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchAllDreams() {
      setLoading(true)
      setError(null)

      try {
        const all: ApiDream[] = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const response = await fetch(`/api/dreams?page=${page}`, { cache: 'no-store' })

          if (!response.ok) {
            throw new Error('Could not load dreams')
          }

          const payload = (await response.json()) as DreamListResponse
          all.push(...(payload.dreams as ApiDream[]))
          hasMore = payload.has_more
          page += 1

          if (page > 200) break
        }

        if (active) {
          setDreams(all)
        }
      } catch {
        if (active) {
          setError('Could not load insights right now. Please refresh and try again.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchAllDreams()

    return () => {
      active = false
    }
  }, [])

  const analytics = useMemo(() => {
    const totalDreams = dreams.length

    const uniqueDates = [...new Set(dreams.map((d) => d.date_of_dream))].sort((a, b) => (a > b ? -1 : 1))

    let currentStreak = 0
    if (uniqueDates.length > 0) {
      currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i += 1) {
        if (daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1) {
          currentStreak += 1
        } else {
          break
        }
      }
    }

    const ascDates = [...uniqueDates].reverse()
    let longestStreak = 0
    let running = 0

    for (let i = 0; i < ascDates.length; i += 1) {
      if (i === 0) {
        running = 1
      } else if (daysBetween(ascDates[i], ascDates[i - 1]) === 1) {
        running += 1
      } else {
        running = 1
      }
      longestStreak = Math.max(longestStreak, running)
    }

    const dayKeys = getDayKeysLast30()
    const recentSet = new Set(dayKeys)

    const moodsByDay = new Map<string, number[]>()
    const recentMoodValues: number[] = []

    dreams.forEach((dream) => {
      if (typeof dream.mood_score !== 'number') return
      if (!recentSet.has(dream.date_of_dream)) return

      if (!moodsByDay.has(dream.date_of_dream)) {
        moodsByDay.set(dream.date_of_dream, [])
      }

      moodsByDay.get(dream.date_of_dream)?.push(dream.mood_score)
      recentMoodValues.push(dream.mood_score)
    })

    const avgMood = recentMoodValues.length > 0
      ? recentMoodValues.reduce((sum, value) => sum + value, 0) / recentMoodValues.length
      : null

    const moodPoints: MoodPoint[] = dayKeys.map((day) => {
      const values = moodsByDay.get(day) ?? []
      const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null
      return {
        date: day,
        label: formatMonthDay(asDateOnly(day)),
        mood: average,
      }
    })

    const lucidCount = dreams.filter((dream) => dream.lucid).length
    const nonLucidCount = totalDreams - lucidCount
    const lucidRate = totalDreams > 0 ? Math.round((lucidCount / totalDreams) * 100) : 0

    const tagMap = new Map<string, TagStat>()
    dreams.forEach((dream) => {
      extractTags(dream).forEach((tag) => {
        const existing = tagMap.get(tag.id)
        if (existing) {
          existing.count += 1
          return
        }

        tagMap.set(tag.id, { id: tag.id, name: tag.name, count: 1 })
      })
    })

    const topTags = [...tagMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const maxTagCount = topTags[0]?.count ?? 1

    return {
      totalDreams,
      currentStreak,
      longestStreak,
      avgMood,
      moodPoints,
      lucidCount,
      nonLucidCount,
      lucidRate,
      topTags,
      maxTagCount,
      chartEntriesWithMood: moodPoints.filter((point) => point.mood !== null).length,
    }
  }, [dreams])

  const avgMoodColor = useMemo(() => {
    if (analytics.avgMood === null) return '#FFFFFF'
    if (analytics.avgMood >= 4) return 'rgba(100,220,120,1)'
    if (analytics.avgMood < 3) return 'rgba(255,160,80,1)'
    return '#FFFFFF'
  }, [analytics.avgMood])

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
        <SectionSkeleton height={92} />
        <div style={{ height: 16 }} />
        <div className="insights-stat-grid" style={{ marginBottom: 18 }}>
          <SectionSkeleton height={160} />
          <SectionSkeleton height={160} />
          <SectionSkeleton height={160} />
          <SectionSkeleton height={160} />
        </div>
        <SectionSkeleton height={320} />
        <div style={{ height: 16 }} />
        <SectionSkeleton height={250} />
        <div style={{ height: 16 }} />
        <SectionSkeleton height={200} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
        <p style={{ border: '1px solid rgba(190,90,100,0.45)', background: 'rgba(190,90,100,0.15)', borderRadius: 14, padding: 14, color: 'rgba(255,235,238,0.95)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (analytics.totalDreams === 0) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '64px 24px 120px' }}>
        <section style={{ minHeight: '62vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 42, color: 'rgba(255,255,255,0.78)', marginBottom: 10 }}>
              Nothing to analyse yet.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 15, marginBottom: 26 }}>
              Capture your first dream to start seeing patterns.
            </p>
            <Link href="/settings/alarm" className="btn-gold">Set your alarm</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(34px,4vw,48px)', color: '#E8E4D9', letterSpacing: '-0.02em' }}>
          Insights
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 16 }}>
          Patterns your waking mind never noticed.
        </p>
      </header>

      <section
        className="insights-stat-grid"
        style={{ marginBottom: 24 }}
      >
        <StatCard
          value={String(analytics.totalDreams)}
          label="dreams captured"
          icon={<span>🌙</span>}
        />
        <StatCard
          value={String(analytics.currentStreak)}
          label="day streak"
          subtext={`Best: ${analytics.longestStreak} days`}
          icon={<span>✦</span>}
        />
        <StatCard
          value={analytics.avgMood !== null ? `${analytics.avgMood.toFixed(1)}/5` : '0.0/5'}
          label="avg mood / 30 days"
          color={avgMoodColor}
          icon={<span>◔</span>}
        />
        <StatCard
          value={`${analytics.lucidRate}%`}
          label="lucid dreams"
          subtext={`${analytics.lucidCount} of ${analytics.totalDreams} entries`}
          icon={<span>☾</span>}
        />
      </section>

      <section
        style={{
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 18,
          overflow: 'hidden',
        }}
      >
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          Mood over the last 30 days
        </p>

        {analytics.chartEntriesWithMood < 3 ? (
          <div style={{ padding: '32px 0 18px' }}>
            <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>Not enough entries yet to show a trend.</p>
            <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 14 }}>Keep capturing — patterns emerge after 7 days.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={analytics.moodPoints}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                  interval={4}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                  ticks={[1, 2, 3, 4, 5]}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,18,40,0.95)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`${Number(value).toFixed(1)} / 5`, 'Mood']}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  connectNulls={false}
                  dot={{ r: 3, fill: '#FFFFFF' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isPro ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(5px)',
              background: 'rgba(5,5,16,0.38)',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 20,
            }}
          >
            <div>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, color: '#E8E4D9' }}>
                Unlock full insights with Somnia Pro
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, marginBottom: 18 }}>$4.99 / month</p>
              <a href="https://sushankhanal.gumroad.com/l/jhdln" target="_blank" rel="noopener noreferrer" className="btn-gold">
                Upgrade
              </a>
            </div>
          </div>
        ) : null}
      </section>

      <section
        style={{
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 18,
          overflow: 'hidden',
        }}
      >
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
          Most used tags
        </p>

        {analytics.topTags.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>No tags yet. Add tags to your entries to see patterns.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {analytics.topTags.map((tag) => {
              const width = (tag.count / analytics.maxTagCount) * 100
              return (
                <div key={tag.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 42px', gap: 12, alignItems: 'center' }}>
                  <p style={{ color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.name}</p>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${width}%`, background: '#fff', borderRadius: 3 }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'right', fontSize: 13 }}>{tag.count}</p>
                </div>
              )
            })}
          </div>
        )}

        {!isPro ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(5px)',
              background: 'rgba(5,5,16,0.38)',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 20,
            }}
          >
            <div>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, color: '#E8E4D9' }}>
                Unlock full insights with Somnia Pro
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, marginBottom: 18 }}>$4.99 / month</p>
              <a href="https://sushankhanal.gumroad.com/l/jhdln" target="_blank" rel="noopener noreferrer" className="btn-gold">
                Upgrade
              </a>
            </div>
          </div>
        ) : null}
      </section>

      <section
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
          Lucid breakdown
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{analytics.lucidCount}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>lucid</p>
          </div>
          <div style={{ height: 56, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{analytics.nonLucidCount}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>non-lucid</p>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 15 }}>
          {analytics.lucidCount > 0
            ? `You've had a lucid dream in ${analytics.lucidRate}% of your entries.`
            : "No lucid dreams logged yet. Mark entries as lucid when you recognise you're dreaming."}
        </p>
      </section>
    </div>
  )
}
