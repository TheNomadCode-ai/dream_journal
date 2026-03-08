'use client'

import { useMemo } from 'react'

type SeedRow = {
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  created_at: string
}

type Props = {
  tier: string
  seeds: SeedRow[]
}

function classifySeed(seed: string) {
  const lower = seed.toLowerCase()
  if (/(safe|home|place|room|house|door)/.test(lower)) return 'place'
  if (/(someone|mother|father|friend|lover|person|miss)/.test(lower)) return 'person'
  if (/(problem|solve|decision|question|stuck)/.test(lower)) return 'problem'
  if (/(memory|childhood|remember|past)/.test(lower)) return 'memory'
  return 'custom'
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

export default function SeedInsightsClient({ tier, seeds }: Props) {
  const isPro = tier === 'pro' || tier === 'lifetime'

  const data = useMemo(() => {
    const total = seeds.length
    const dreamed = seeds.filter((seed) => seed.was_dreamed === true).length
    const last7 = [...seeds]
      .sort((a, b) => (a.seed_date > b.seed_date ? -1 : 1))
      .slice(0, 7)
      .reverse()

    const byType = new Map<string, { total: number; dreamed: number }>()
    const byDay = new Map<number, { total: number; dreamed: number }>()
    const byTime = new Map<string, { total: number; dreamed: number }>()

    for (const seed of seeds) {
      const type = classifySeed(seed.seed_text)
      const t = byType.get(type) ?? { total: 0, dreamed: 0 }
      t.total += 1
      if (seed.was_dreamed === true) t.dreamed += 1
      byType.set(type, t)

      const day = new Date(`${seed.seed_date}T00:00:00`).getDay()
      const d = byDay.get(day) ?? { total: 0, dreamed: 0 }
      d.total += 1
      if (seed.was_dreamed === true) d.dreamed += 1
      byDay.set(day, d)

      const hour = new Date(seed.created_at).getHours()
      const bucket = hour < 24 ? 'before-midnight' : 'after-midnight'
      const bucketData = byTime.get(bucket) ?? { total: 0, dreamed: 0 }
      bucketData.total += 1
      if (seed.was_dreamed === true) bucketData.dreamed += 1
      byTime.set(bucket, bucketData)
    }

    const bestType = [...byType.entries()].sort((a, b) => pct(b[1].dreamed, b[1].total) - pct(a[1].dreamed, a[1].total))[0]
    const bestDay = [...byDay.entries()].sort((a, b) => pct(b[1].dreamed, b[1].total) - pct(a[1].dreamed, a[1].total))[0]

    const dayLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return {
      total,
      dreamed,
      successRate: pct(dreamed, total),
      last7,
      byType,
      bestType,
      bestDayLabel: bestDay ? dayLabel[bestDay[0]] : null,
      bestDayRate: bestDay ? pct(bestDay[1].dreamed, bestDay[1].total) : 0,
      beforeMidnightRate: pct(byTime.get('before-midnight')?.dreamed ?? 0, byTime.get('before-midnight')?.total ?? 0),
      afterMidnightRate: pct(byTime.get('after-midnight')?.dreamed ?? 0, byTime.get('after-midnight')?.total ?? 0),
    }
  }, [seeds])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 120px' }}>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 10 }}>Seed Insights</h1>
      <p style={{ color: '#bca7de', marginBottom: 20 }}>Patterns from your dream incubation loop.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
        <div style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
          <p style={{ color: '#9f8abb', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total seeds</p>
          <p style={{ fontSize: 34 }}>{data.total}</p>
        </div>
        <div style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
          <p style={{ color: '#9f8abb', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Success rate</p>
          <p style={{ fontSize: 34 }}>{data.successRate}%</p>
        </div>
        <div style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
          <p style={{ color: '#9f8abb', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Dreamed</p>
          <p style={{ fontSize: 34 }}>{data.dreamed}</p>
        </div>
      </div>

      <section style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22', marginBottom: 16 }}>
        <p style={{ color: '#9f8abb', marginBottom: 10 }}>Last 7 days</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {data.last7.map((seed) => (
            <div key={`${seed.seed_date}-${seed.seed_text}`} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: 10, alignItems: 'center' }}>
              <p style={{ color: '#cbb7e4', fontSize: 13 }}>{seed.seed_date}</p>
              <p style={{ color: '#efe8ff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{seed.seed_text}</p>
              <p style={{ color: seed.was_dreamed ? '#9be2b0' : '#a7a2b1', textAlign: 'right' }}>{seed.was_dreamed ? 'Yes' : seed.was_dreamed === false ? 'No' : 'N/A'}</p>
            </div>
          ))}
        </div>
      </section>

      {!isPro ? (
        <section style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
          <p style={{ color: '#d8c6f0', marginBottom: 8 }}>Pro unlocks:</p>
          <p style={{ color: '#bca7de' }}>Success rate by seed type, best categories, day-of-week analysis, time pattern analysis, and AI summaries.</p>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
            <p style={{ color: '#d8c6f0', marginBottom: 8 }}>Success by seed type</p>
            {[...data.byType.entries()].map(([type, stats]) => (
              <p key={type} style={{ color: '#bca7de' }}>
                {type}: {pct(stats.dreamed, stats.total)}% ({stats.dreamed}/{stats.total})
              </p>
            ))}
          </div>
          <div style={{ border: '1px solid #2a1f45', borderRadius: 12, padding: 14, background: '#100a22' }}>
            <p style={{ color: '#d8c6f0', marginBottom: 8 }}>Pattern summary</p>
            <p style={{ color: '#bca7de' }}>
              Best category: {data.bestType ? `${data.bestType[0]} (${pct(data.bestType[1].dreamed, data.bestType[1].total)}%)` : 'Not enough data'}.
              {' '}Most responsive day: {data.bestDayLabel ?? 'Not enough data'} ({data.bestDayRate}%).
            </p>
            <p style={{ color: '#bca7de', marginTop: 8 }}>
              Seeds planted before midnight: {data.beforeMidnightRate}% success. After midnight: {data.afterMidnightRate}% success.
            </p>
            <p style={{ color: '#e2d6f3', marginTop: 10 }}>
              Based on your last 30 dreams your subconscious responds strongest to your top category. Repeat that category for one week for higher recall consistency.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
