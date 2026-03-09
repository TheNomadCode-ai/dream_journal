'use client'

const PROFILE_CACHE_KEY = 'somnia_profile'
const PROFILE_CACHE_TTL_MS = 30 * 60 * 1000

type CachedProfile<T> = {
  data: T
  cachedAt: number
}

export function getCachedProfile<T>() {
  if (typeof window === 'undefined') return null

  try {
    const cached = window.localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null

    const parsed = JSON.parse(cached) as CachedProfile<T>
    const age = Date.now() - parsed.cachedAt
    if (age > PROFILE_CACHE_TTL_MS) return null

    return parsed.data
  } catch {
    return null
  }
}

export function cacheProfile<T>(profile: T) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        data: profile,
        cachedAt: Date.now(),
      })
    )
  } catch {
    // Ignore storage write failures in private mode or quota limits.
  }
}
