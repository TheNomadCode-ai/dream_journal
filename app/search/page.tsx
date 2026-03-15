'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'
import { useDebounce } from '@/hooks/useDebounce'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { getAllDreams, getAllSeeds, type DreamEntry, type SeedEntry } from '@/lib/local-db'

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function buildDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const values: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    values.push(cursor.toISOString().split('T')[0])
    cursor.setDate(cursor.getDate() + 1)
  }

  return values
}

function SkeletonCard() {
  return (
    <div className="search-result-card is-skeleton" aria-hidden="true">
      <div className="search-skeleton shimmer" style={{ width: '34%', height: 14, marginBottom: 12 }} />
      <div className="search-skeleton shimmer" style={{ width: '62%', height: 18, marginBottom: 16 }} />
      <div className="search-skeleton shimmer" style={{ width: '100%', height: 12, marginBottom: 8 }} />
      <div className="search-skeleton shimmer" style={{ width: '88%', height: 12, marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="search-skeleton shimmer" style={{ width: 70, height: 22 }} />
        <div className="search-skeleton shimmer" style={{ width: 58, height: 22 }} />
      </div>
    </div>
  )
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return <span className="search-meta-pill">{children}</span>
}

type ArchiveRow = {
  date: string
  dream: DreamEntry | null
  seed: SeedEntry | null
  hasDream: boolean
  hasSeed: boolean
  morningDone: boolean
  isMissed: boolean
  matchedSeed: boolean
  matchedDream: boolean
  hasAnyMatch: boolean
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim()
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [rows, setRows] = useState<ArchiveRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query.trim(), 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useKeyboardShortcut(['Meta+k', 'Control+k'], (event) => {
    event.preventDefault()
    inputRef.current?.focus()
    inputRef.current?.select()
  })

  const filteredRows = useMemo(() => {
    if (!debouncedQuery) return rows
    return rows.filter((row) => row.hasAnyMatch)
  }, [debouncedQuery, rows])

  const runSearch = useCallback(async (targetQuery: string) => {
    setLoading(true)
    setError(null)

    try {
      const [dreams, seeds] = await Promise.all([getAllDreams(), getAllSeeds()])
      const dreamByDate = new Map(dreams.map((dream) => [dream.date, dream]))
      const seedByDate = new Map(seeds.map((seed) => [seed.date, seed]))
      const allDates = [...new Set([...dreams.map((dream) => dream.date), ...seeds.map((seed) => seed.date)])].sort()

      if (allDates.length === 0) {
        setRows([])
        setError(null)
        return
      }

      const range = buildDateRange(allDates[0], getTodayKey())
      const queryLower = targetQuery.toLowerCase()

      const merged = range
        .map((date) => {
          const seed = seedByDate.get(date) ?? null
          const dream = dreamByDate.get(date) ?? null
          const dreamText = normalizeText(dream?.content)
          const seedText = normalizeText(seed?.seedText)
          const matchedSeed = Boolean(queryLower) && seedText.toLowerCase().includes(queryLower)
          const matchedDream = Boolean(queryLower) && dreamText.toLowerCase().includes(queryLower)

          const morningDone = Boolean(seed?.morningEntryWritten) || Boolean(dream)
          const isPast = date < getTodayKey()
          const isMissed = !morningDone && isPast

          return {
            date,
            dream,
            seed,
            hasDream: Boolean(dream),
            hasSeed: Boolean(seed),
            morningDone,
            isMissed,
            matchedSeed,
            matchedDream,
            hasAnyMatch: matchedSeed || matchedDream,
          }
        })
        .reverse()

      setRows(merged)
      setError(null)
    } catch {
      setError('We could not load your archive right now. Please try again.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void runSearch(debouncedQuery)
  }, [debouncedQuery, runSearch])

  function clearSearch() {
    setQuery('')
    setError(null)
    inputRef.current?.focus()
  }

  function renderEmptyState() {
    if (loading) {
      return (
        <section aria-label="Loading search results">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      )
    }

    if (rows.length === 0 && !error) {
      return (
        <section className="search-empty-shell" aria-live="polite">
          <p className="search-empty-title">No archive entries yet</p>
          <p className="search-empty-subtitle">Plant a seed tonight or capture a dream tomorrow morning.</p>
        </section>
      )
    }

    if (debouncedQuery && filteredRows.length === 0 && !error) {
      return (
        <section className="search-empty-shell" aria-live="polite">
          <p className="search-empty-title">No entries match that search</p>
          <p className="search-empty-subtitle">Try a different keyword from your seed or dream text.</p>
        </section>
      )
    }

    return null
  }

  return (
    <div className="search-page-shell page-enter">
      <header className="search-top-nav" role="navigation" aria-label="Dashboard navigation">
        <div className="search-top-nav-inner">
          <span className="search-brand">Somnia</span>
          <nav className="search-top-links">
            {DASHBOARD_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={`search-top-link${item.href === '/search' ? ' active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="search-main">
        <section className="search-input-wrap">
          <div className="search-input-shell">
            <span className="search-input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
            </span>

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-input"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search your dreams..."
              aria-label="Search your dreams"
            />

            {loading ? (
              <span className="search-spinner" aria-hidden="true" />
            ) : null}

            {!loading && query ? (
              <button type="button" className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">
                ×
              </button>
            ) : null}
          </div>
        </section>

        <section className="search-results-wrap">
          {error ? <p className="search-error-banner">{error}</p> : null}

          {renderEmptyState()}

          {filteredRows.length > 0 ? (
            <>
              {filteredRows.map((row) => (
                <article
                  key={row.date}
                  className="search-result-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/entry/${row.date}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      router.push(`/entry/${row.date}`)
                    }
                  }}
                  style={
                    !row.hasDream && !row.hasSeed
                      ? { opacity: 0.58, borderColor: 'rgba(130,110,180,0.35)' }
                      : undefined
                  }
                >
                  <div className="search-result-top">
                    <h3 className="search-result-title">{formatDate(row.date)}</h3>
                    <p className="search-result-date">
                      {row.isMissed ? 'Missed' : 'Completed'}
                    </p>
                  </div>

                  <p className="search-result-snippet" style={{ marginBottom: 6 }}>
                    <strong>Seed:</strong>{' '}
                    {row.seed?.seedText ? row.seed.seedText : (!row.hasDream && !row.hasSeed ? '— Missed' : 'No seed recorded')}
                  </p>

                  <p className="search-result-snippet">
                    <strong>Dream:</strong>{' '}
                    {row.dream?.content ? row.dream.content : (!row.hasDream && !row.hasSeed ? '— Missed' : 'No dream recorded')}
                  </p>

                  <div className="search-result-bottom">
                    {typeof row.seed?.matchPercentage === 'number' ? (
                      <span
                        className="search-meta-pill"
                        style={{ color: '#1d1200', background: 'rgba(201,168,76,0.95)', borderColor: 'rgba(201,168,76,0.95)' }}
                      >
                        {row.seed.matchPercentage}% match
                      </span>
                    ) : null}
                    {row.matchedSeed ? <MetaPill>Matched seed</MetaPill> : null}
                    {row.matchedDream ? <MetaPill>Matched dream</MetaPill> : null}
                    {!debouncedQuery && !row.hasDream && !row.hasSeed ? <MetaPill>Gap day</MetaPill> : null}
                  </div>
                </article>
              ))}
            </>
          ) : null}
        </section>
      </main>

      <footer className="search-footer">
        <p>Every dream stays private. No ads. No resale.</p>
      </footer>
    </div>
  )
}
