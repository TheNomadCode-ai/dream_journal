'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type WakeLog = {
  log_date: string
  minutes_from_target: number | null
  sleep_quality: number | null
  morning_light: number | null
}

type Props = {
  logs: WakeLog[]
  freezesRemaining: number
}

function scoreDeviation(avgDeviation: number) {
  if (avgDeviation <= 10) return 100
  if (avgDeviation <= 20) return 85
  if (avgDeviation <= 30) return 70
  if (avgDeviation <= 45) return 50
  return 25
}

function calculateStreak(logs: WakeLog[]) {
  const byDate = new Set(logs.map((log) => log.log_date))
  let streak = 0
  const cursor = new Date()

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!byDate.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function metricColor(value: number) {
  if (value >= 80) return '#57d08b'
  if (value >= 60) return '#f2cb66'
  return '#e47c7c'
}

export default function BioClock({ logs, freezesRemaining }: Props) {
  const metrics = useMemo(() => {
    if (!logs.length) {
      return {
        score: 0,
        breakdown: [
          { label: 'Wake Timing', value: 0, weight: 40 },
          { label: 'Morning Light', value: 0, weight: 20 },
          { label: 'Sleep Quality', value: 0, weight: 20 },
          { label: 'Logging Consistency', value: 0, weight: 20 },
        ],
      }
    }

    const avgDeviation = logs.reduce((sum, log) => sum + Math.abs(log.minutes_from_target ?? 0), 0) / logs.length
    const wakeTimingScore = scoreDeviation(avgDeviation)
    const lightHits = logs.filter((log) => (log.morning_light ?? 0) >= 10).length
    const morningLightScore = Math.round((lightHits / logs.length) * 100)
    const qualityValues = logs.map((log) => log.sleep_quality).filter((value): value is number => value !== null)
    const avgQuality = qualityValues.length ? qualityValues.reduce((sum, value) => sum + value, 0) / qualityValues.length : 0
    const sleepQualityScore = Math.round((avgQuality / 5) * 100)
    const loggingConsistencyScore = Math.round((Math.min(logs.length, 7) / 7) * 100)

    const score = Math.round(
      wakeTimingScore * 0.4 +
      morningLightScore * 0.2 +
      sleepQualityScore * 0.2 +
      loggingConsistencyScore * 0.2
    )

    return {
      score,
      breakdown: [
        { label: 'Wake Timing', value: wakeTimingScore, weight: 40 },
        { label: 'Morning Light', value: morningLightScore, weight: 20 },
        { label: 'Sleep Quality', value: sleepQualityScore, weight: 20 },
        { label: 'Logging Consistency', value: loggingConsistencyScore, weight: 20 },
      ],
    }
  }, [logs])

  const streak = useMemo(() => calculateStreak(logs), [logs])

  const chartData = useMemo(
    () => logs.slice().reverse().map((log) => ({
      day: new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' }),
      deviation: Math.abs(log.minutes_from_target ?? 0),
      fill:
        Math.abs(log.minutes_from_target ?? 0) <= 15
          ? '#57d08b'
          : Math.abs(log.minutes_from_target ?? 0) <= 30
            ? '#f2cb66'
            : '#e47c7c',
    })),
    [logs]
  )

  const radius = 82
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - metrics.score / 100)

  return (
    <section style={{ border: '1px solid #2f2250', background: '#100a22', borderRadius: 16, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="bioClockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(140,80,255,1)" />
              <stop offset="100%" stopColor="rgba(180,130,255,0.6)" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="14" fill="none" />
          <circle
            cx="110"
            cy="110"
            r={radius}
            stroke="url(#bioClockGradient)"
            strokeWidth="14"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 700ms ease' }}
          />
          <text x="110" y="106" textAnchor="middle" fill="#f1e9ff" fontSize="44" fontFamily="Cormorant">
            {metrics.score}
          </text>
          <text x="110" y="132" textAnchor="middle" fill="#bda7e7" fontSize="16">/ 100</text>
          <text x="110" y="156" textAnchor="middle" fill="#bda7e7" fontSize="12" style={{ letterSpacing: '0.12em' }}>
            BIO CLOCK SCORE
          </text>
        </svg>
      </div>

      <p style={{ textAlign: 'center', color: '#e3d5ff', marginTop: 8 }}>
        {streak} day streak 🔥
      </p>
      <p style={{ textAlign: 'center', color: '#cdb7ef', marginTop: 4 }}>
        {freezesRemaining > 0 ? `Streak freeze available this week (${freezesRemaining} left)` : 'No streak freezes left this week'}
      </p>

      {!logs.length ? (
        <p style={{ marginTop: 14, textAlign: 'center', color: '#b7a3d7' }}>
          Start logging your mornings to build your biological clock score.
        </p>
      ) : (
        <div style={{ width: '100%', height: 220, marginTop: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="#b8a7d8" />
              <YAxis stroke="#b8a7d8" />
              <ReferenceLine y={15} stroke="rgba(180,130,255,0.8)" strokeDasharray="4 4" />
              <Bar dataKey="deviation" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {metrics.breakdown.map((item) => (
          <div key={item.label}>
            <p style={{ display: 'flex', justifyContent: 'space-between', color: '#ddcef7', fontSize: 13, marginBottom: 4 }}>
              <span>{item.label} ({item.weight}%)</span>
              <span>{item.value}</span>
            </p>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${item.value}%`, height: '100%', background: metricColor(item.value), transition: 'width 450ms ease' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
