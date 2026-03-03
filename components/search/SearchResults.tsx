'use client'

import Link from 'next/link'

import type { DreamSearchResponse } from '@/types/dream'

interface SearchResultsProps {
  data: DreamSearchResponse | null
  loading?: boolean
  query?: string
}

function HighlightedSnippet({ html }: { html: string }) {
  return (
    <p
      className="mt-1 line-clamp-3 text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:px-0.5"
      // ts_headline returns safe HTML with <mark> tags only
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="skeleton mb-2 h-3 w-24 rounded" />
      <div className="skeleton mb-2 h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton mt-1 h-4 w-2/3 rounded" />
    </div>
  )
}

export function SearchResults({ data, loading = false, query = '' }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading search results">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!data) return null

  const { results, total } = data

  if (results.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-16 text-center"
        role="status"
        aria-label="No results found"
      >
        <span className="mb-3 text-4xl" aria-hidden="true">🌑</span>
        <p className="text-base font-medium text-foreground">
          {query ? `No dreams match "${query}"` : 'No dreams yet'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {query
            ? 'Try different keywords, or browse all entries below.'
            : 'Start logging your first dream to see it here.'}
        </p>
        {query && (
          <Link href="/dashboard" className="btn-ghost mt-4 text-sm">
            Browse all dreams →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Result count */}
      <p className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite">
        {query ? (
          <>
            <span className="font-medium text-foreground">{total}</span>{' '}
            {total === 1 ? 'result' : 'results'} for{' '}
            <span className="font-medium text-foreground">"{query}"</span>
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">{total}</span> recent{' '}
            {total === 1 ? 'dream' : 'dreams'}
          </>
        )}
      </p>

      <ul className="space-y-3" role="list" aria-label="Search results">
        {results.map((result) => (
          <li key={result.id}>
            <Link
              href={`/dreams/${result.id}`}
              className="card-hover block p-4 no-underline"
              aria-label={result.title ?? `Dream from ${result.date_of_dream}`}
            >
              {/* Date */}
              <time
                dateTime={result.date_of_dream}
                className="text-xs text-muted-foreground"
              >
                {new Date(result.date_of_dream).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>

              {/* Title */}
              <h3 className="mt-0.5 text-base font-medium text-foreground">
                {result.title ?? (
                  <span className="italic text-muted-foreground">Untitled dream</span>
                )}
              </h3>

              {/* Highlighted snippet or body text */}
              {result.headline ? (
                <HighlightedSnippet html={result.headline} />
              ) : result.body_text ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {result.body_text}
                </p>
              ) : null}

              {/* Meta row */}
              <div className="mt-2 flex items-center gap-2">
                {result.lucid && (
                  <span className="badge-lucid text-xs" aria-label="Lucid dream">
                    ✦ Lucid
                  </span>
                )}
                {result.mood_score && (
                  <span
                    className="badge-muted text-xs"
                    aria-label={`Mood score ${result.mood_score} out of 5`}
                  >
                    Mood {result.mood_score}/5
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
