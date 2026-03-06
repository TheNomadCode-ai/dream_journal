'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'
import { useDebounce } from '@/hooks/useDebounce'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import type { DreamSearchResponse, DreamSearchResult, Tag } from '@/types/dream'

type SearchApiResponse = DreamSearchResponse

const PER_PAGE = 20

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

function RenderSnippet({ snippet }: { snippet: string }) {
  return (
    <p
      className="search-result-snippet"
      // Search API returns only plain snippets + ts_headline mark tags.
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  )
}

export default function SearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DreamSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
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

  const canLoadMore = useMemo(() => results.length < total, [results.length, total])

  const runSearch = useCallback(async (targetQuery: string, page: number) => {
    if (!targetQuery) {
      setResults([])
      setTotal(0)
      setLoading(false)
      setLoadingMore(false)
      setError(null)
      return
    }

    const isFirstPage = page === 1
    if (isFirstPage) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({ q: targetQuery, page: String(page), per_page: String(PER_PAGE) })
      const response = await fetch(`/api/dreams/search?${params.toString()}`, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = (await response.json()) as SearchApiResponse

      if (isFirstPage) {
        setResults(data.results)
      } else {
        setResults((current) => {
          const seen = new Set(current.map((item) => item.id))
          const deduped = data.results.filter((item) => !seen.has(item.id))
          return [...current, ...deduped]
        })
      }

      setTotal(data.total)
      setError(null)
    } catch {
      setError('We could not search your dreams right now. Please try again.')
      if (isFirstPage) {
        setResults([])
        setTotal(0)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void runSearch(debouncedQuery, 1)
  }, [debouncedQuery, runSearch])

  function clearSearch() {
    setQuery('')
    setResults([])
    setTotal(0)
    setError(null)
    inputRef.current?.focus()
  }

  function handleLoadMore() {
    if (!debouncedQuery || loadingMore || !canLoadMore) return
    const page = Math.floor(results.length / PER_PAGE) + 1
    void runSearch(debouncedQuery, page)
  }

  function renderEmptyState() {
    if (!debouncedQuery) {
      return (
        <section className="search-empty-shell" aria-live="polite">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.32 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <p className="search-empty-title">Search across all your dreams</p>
          <p className="search-empty-subtitle">Every word of every entry is indexed.</p>
        </section>
      )
    }

    if (loading) {
      return (
        <section aria-label="Loading search results">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      )
    }

    if (results.length === 0 && !error) {
      return (
        <section className="search-empty-shell" aria-live="polite">
          <p className="search-empty-title">No dreams match that search</p>
          <p className="search-empty-subtitle">Try a different word, symbol, or feeling.</p>
        </section>
      )
    }

    return null
  }

  return (
    <div className="search-page-shell">
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

            {loading && debouncedQuery ? (
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

          {results.length > 0 ? (
            <>
              {results.map((result) => (
                <article
                  key={result.id}
                  className="search-result-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dreams/${result.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      router.push(`/dreams/${result.id}`)
                    }
                  }}
                >
                  <div className="search-result-top">
                    <h3 className="search-result-title">{result.title || 'Untitled dream'}</h3>
                    <p className="search-result-date">{formatDate(result.date_of_dream)}</p>
                  </div>

                  {result.headline ? (
                    <RenderSnippet snippet={result.headline} />
                  ) : (
                    <p className="search-result-snippet">{result.body_text ?? 'No excerpt available.'}</p>
                  )}

                  <div className="search-result-bottom">
                    {typeof result.mood_score === 'number' ? <MetaPill>Mood {result.mood_score}/5</MetaPill> : null}
                    {result.lucid ? <MetaPill>Lucid</MetaPill> : null}
                    {(result.tags as Tag[] | undefined)?.map((tag) => (
                      <MetaPill key={tag.id}>#{tag.name}</MetaPill>
                    ))}
                  </div>
                </article>
              ))}

              {canLoadMore ? (
                <button
                  type="button"
                  className="search-load-more"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                >
                  {loadingMore ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <span className="search-spinner" aria-hidden="true" />
                      Loading more dreams...
                    </span>
                  ) : (
                    'Load more dreams'
                  )}
                </button>
              ) : null}
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
