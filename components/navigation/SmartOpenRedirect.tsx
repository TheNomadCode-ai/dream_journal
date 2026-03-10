'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { useApp } from '@/context/AppContext'
import { dateKeyLocal } from '@/lib/dream-cycle'
import { getCachedProfile } from '@/lib/profile-cache'

type CachedProfile = {
  target_wake_time: string | null
}

export default function SmartOpenRedirect() {
  if (typeof window === 'undefined') return null

  const pathname = usePathname()
  const { profile, user } = useApp()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const protectedPrefixes = [
      '/dashboard',
      '/morning',
      '/evening',
      '/search',
      '/settings',
      '/journal',
    ]

    const isProtectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    if (!isProtectedRoute) {
      return
    }

    // Never redirect crawlers/guests or unauthenticated sessions.
    if (!user) return

    void (async () => {
      const now = new Date()
      const nowTotal = now.getHours() * 60 + now.getMinutes()
      const cachedProfile = getCachedProfile<CachedProfile>()
      const sourceProfile = cachedProfile ?? profile

      const wake = sourceProfile?.target_wake_time ?? '07:00:00'
      const [wakeH, wakeM] = wake.split(':').map(Number)

      const wakeTotal = wakeH * 60 + wakeM
      const morningStart = wakeTotal - 120
      const morningEnd = wakeTotal

      const today = dateKeyLocal(0)
      const morningDone = localStorage.getItem('somnia_morning_entry_date') === today
      const seedPlanted = localStorage.getItem('somnia_seed_planted_date') === today
      const inMorningWindow = nowTotal >= morningStart && nowTotal <= morningEnd

      // Full access once morning entry is complete for today.
      if (morningDone) {
        return
      }

      // During morning window with a planted seed, only /morning is allowed.
      if (inMorningWindow && seedPlanted) {
        if (pathname !== '/morning') {
          window.location.href = '/morning'
        }
        return
      }

      // Outside morning window with a planted seed, lock to /evening.
      if (seedPlanted && !inMorningWindow) {
        if (pathname !== '/evening') {
          window.location.href = '/evening'
        }
        return
      }

      // No seed planted today: keep /morning unavailable and allow other sections.
      if (pathname === '/morning') {
        window.location.href = '/evening'
      }
    })()
  }, [pathname, profile, user])

  return null
}
