'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { getDreamByDate, getSeedByDate, type DreamEntry, type SeedEntry } from '@/lib/local-db'

type EntryStatus = 'dreamed' | 'missed' | 'pending'

function formatDateHeader(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

export default function EntryPage() {
  const params = useParams<{ date: string }>()
  const dateParam = params?.date ?? ''

  const [loading, setLoading] = useState(true)
  const [seed, setSeed] = useState<SeedEntry | null>(null)
  const [dream, setDream] = useState<DreamEntry | null>(null)

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)

  useEffect(() => {
    let active = true

    async function load() {
      if (!isValidDate) {
        setLoading(false)
        return
      }

      setLoading(true)
      const [seedRow, dreamRow] = await Promise.all([getSeedByDate(dateParam), getDreamByDate(dateParam)])

      if (!active) return
      setSeed(seedRow)
      setDream(dreamRow)
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [dateParam, isValidDate])

  const canRevealSeed = useMemo(() => {
    if (!seed) return false
    return seed.morningEntryWritten
  }, [seed])

  const status: EntryStatus = useMemo(() => {
    if (seed?.wasDreamed === true) return 'dreamed'
    if (seed?.wasDreamed === false) return 'missed'
    return 'pending'
  }, [seed?.wasDreamed])

  if (!isValidDate) {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 44, marginBottom: 12 }}>
            Invalid entry date
          </h1>
          <Link className="btn-gold" href="/dashboard">Back to Dashboard</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: '28px 22px 100px' }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 46, lineHeight: 1.05 }}>
            {formatDateHeader(dateParam)}
          </h1>
          <Link className="btn-gold" href="/dashboard">Back</Link>
        </div>

        {loading ? (
          <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18 }}>
            <p style={{ color: '#bca7de' }}>Loading entry...</p>
          </section>
        ) : (
          <>
            <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18, marginBottom: 14 }}>
              <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a993cd', fontSize: 11, marginBottom: 10 }}>
                Your seed
              </p>
              {seed ? (
                canRevealSeed ? (
                  <p style={{ color: '#efe8ff', lineHeight: 1.7 }}>{seed.seedText}</p>
                ) : (
                  <p style={{ color: '#8f84a5' }}>Hidden until your morning entry is complete.</p>
                )
              ) : (
                <p style={{ color: '#8f84a5' }}>No seed recorded</p>
              )}
            </section>

            <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18, marginBottom: 14 }}>
              <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a993cd', fontSize: 11, marginBottom: 10 }}>
                What came back
              </p>
              {dream?.content ? (
                <p style={{ color: '#efe8ff', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{dream.content}</p>
              ) : (
                <p style={{ color: '#8f84a5' }}>No entry recorded</p>
              )}
            </section>

            <section style={{ border: '1px solid #2a1f45', borderRadius: 14, background: '#100a22', padding: 18 }}>
              <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a993cd', fontSize: 11, marginBottom: 10 }}>
                Status
              </p>
              <p style={{ color: '#efe8ff' }}>
                {status === 'dreamed' ? 'Dreamed it' : status === 'missed' ? "Didn't dream it" : 'Awaiting confirmation'}
              </p>

              {typeof seed?.matchPercentage === 'number' ? (
                <div style={{ marginTop: 14 }}>
                  <p style={{ color: '#d6c57f', marginBottom: 8 }}>
                    You rated this dream a {seed.matchPercentage}% match to your seed
                  </p>
                  <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${seed.matchPercentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, rgba(201,168,76,0.55), rgba(201,168,76,0.95))',
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}
      </section>
    </main>
  )
}
