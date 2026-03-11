'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { useApp } from '@/context/AppContext'
import { dateKeyLocal } from '@/lib/dream-cycle'
import { getCachedProfile } from '@/lib/profile-cache'

type CachedProfile = {
  target_wake_time: string | null
  target_sleep_time: string | null
  tier: string | null
  trial_ends_at: string | null
}

export default function SmartOpenRedirect() {
  if (typeof window === 'undefined') return null

  const pathname = usePathname()
  const { profile, user } = useApp()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Never redirect away from these pages — user navigated here intentionally.
    if (
      pathname === '/morning' ||
      pathname === '/evening' ||
      pathname === '/settings' ||
      pathname === '/install' ||
      pathname === '/signup' ||
      pathname === '/login'
    ) return

    // Only run redirect logic on /dashboard.
    if (pathname !== '/dashboard') return

    // Never redirect crawlers/guests or unauthenticated sessions.
    if (!user) return

    void (async () => {
      const now = new Date()
      const nowTotal = now.getHours() * 60 + now.getMinutes()
      const cachedProfile = getCachedProfile<CachedProfile>()
      const sourceProfile = cachedProfile ?? profile

      const wake = sourceProfile?.target_wake_time ?? '07:00:00'
      const sleep = sourceProfile?.target_sleep_time ?? '23:00:00'
      const tier = sourceProfile?.tier ?? 'free'
      const trialActive =
        tier === 'free' &&
        Boolean(sourceProfile?.trial_ends_at) &&
        new Date(sourceProfile?.trial_ends_at ?? '').getTime() > Date.now()
      const hasSeedAccess = tier === 'pro' || tier === 'lifetime' || trialActive
      const [wakeH, wakeM] = wake.split(':').map(Number)
      const [sleepH, sleepM] = sleep.split(':').map(Number)

      function normalizeMinutes(total: number) {
        const day = 24 * 60
        return ((total % day) + day) % day
      }

      function isWithinWindow(current: number, start: number, end: number) {
        const currentNorm = normalizeMinutes(current)
        const startNorm = normalizeMinutes(start)
        const endNorm = normalizeMinutes(end)
        if (startNorm <= endNorm) {
          return currentNorm >= startNorm && currentNorm <= endNorm
        }
        return currentNorm >= startNorm || currentNorm <= endNorm
      }

      const wakeTotal = wakeH * 60 + wakeM
      const sleepTotal = sleepH * 60 + sleepM
      const morningStart = wakeTotal - 120
      const morningEnd = wakeTotal
      const eveningStart = sleepTotal - 10
      const eveningEnd = sleepTotal

      const today = dateKeyLocal(0)
      const morningDone = localStorage.getItem('somnia_morning_entry_date') === today
      const seedPlanted = localStorage.getItem('somnia_seed_planted_date') === today
      const inMorningWindow = isWithinWindow(nowTotal, morningStart, morningEnd)
      const inEveningWindow = isWithinWindow(nowTotal, eveningStart, eveningEnd)

      // Full access once morning entry is complete for today.
      if (morningDone) {
        return
      }

      // During morning window with a planted seed, redirect dashboard → /morning.
      if (inMorningWindow && seedPlanted) {
        window.location.href = '/morning'
        return
      }

      // ONLY redirect to evening if the evening window is open right now.
      if (hasSeedAccess && inEveningWindow && !seedPlanted) {
        window.location.href = '/evening'
        return
      }
    })()
  }, [pathname, profile, user])

  return null
}
