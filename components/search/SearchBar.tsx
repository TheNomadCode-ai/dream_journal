'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useDebounce } from '@/hooks/useDebounce'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

interface SearchBarProps {
  defaultValue?: string
  onSearch?: (query: string) => void
  /** If true, navigates to /search?q=... instead of calling onSearch */
  navigate?: boolean
  placeholder?: string
  className?: string
}

export function SearchBar({
  defaultValue = '',
  onSearch,
  navigate = false,
  placeholder = 'Search dreams…',
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  // Cmd+K / Ctrl+K focuses the search input
  useKeyboardShortcut(['Meta+k', 'Control+k'], (e) => {
    e.preventDefault()
    inputRef.current?.focus()
    inputRef.current?.select()
  })

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedQuery === defaultValue) return

    if (navigate) {
      const params = new URLSearchParams()
      if (debouncedQuery) params.set('q', debouncedQuery)
      router.push(`/search${debouncedQuery ? `?${params}` : ''}`)
      return
    }

    if (onSearch) {
      setLoading(true)
      onSearch(debouncedQuery)
      // Consumer is responsible for unsetting loading via a state prop
      // We reset after a tick to avoid flash
      setTimeout(() => setLoading(false), 350)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  function handleClear() {
    setQuery('')
    inputRef.current?.focus()
    if (navigate) router.push('/search')
    if (onSearch) onSearch('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search icon */}
      <span className="pointer-events-none absolute left-3 text-muted-foreground" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label="Search your dreams"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="form-input pl-9 pr-20"
        autoComplete="off"
        spellCheck={false}
      />

      {/* Keyboard hint */}
      {!query && (
        <span
          className="pointer-events-none absolute right-3 hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
          aria-hidden="true"
        >
          <kbd className="rounded border border-surface-border bg-surface px-1 py-0.5 font-mono text-xs">⌘K</kbd>
        </span>
      )}

      {/* Loading spinner */}
      {loading && query && (
        <span className="absolute right-3" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </span>
      )}

      {/* Clear button */}
      {!loading && query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
