'use client'

import { useEffect, useState } from 'react'

/**
 * useDebounce — returns a debounced copy of `value` that updates
 * only after `delay` ms of inactivity.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
