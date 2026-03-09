'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { useApp } from '@/context/AppContext'
import { dateKeyLocal } from '@/lib/dream-cycle'
import { getCachedProfile } from '@/lib/profile-cache'
import { createClient } from '@/lib/supabase/client'

type CachedProfile = {
  target_wake_time: string | null
  target_sleep_time: string | null
  tier: string | null
  trial_ends_at: string | null
}

export default function SmartOpenRedirect() {
  const pathname = usePathname()
  const checkedRef = useRef(false)
  const { profile, user } = useApp()

  useEffect(() => {
    if (pathname !== '/dashboard') return
    if (checkedRef.current) return

    checkedRef.current = true

    const now = new Date()
    const nowTotal = now.getHours() * 60 + now.getMinutes()
    const cachedProfile = getCachedProfile<CachedProfile>()
    const sourceProfile = cachedProfile ?? profile

    const wake = sourceProfile?.target_wake_time ?? '07:00:00'
    const sleep = sourceProfile?.target_sleep_time ?? '23:00:00'
    const [wakeH, wakeM] = wake.split(':').map(Number)
    const [sleepH, sleepM] = sleep.split(':').map(Number)

    const wakeTotal = wakeH * 60 + wakeM
    const sleepTotal = sleepH * 60 + sleepM
    const morningStart = wakeTotal - 120
    const morningEnd = wakeTotal
    const eveningStart = sleepTotal - 10
    const eveningEnd = sleepTotal

    const today = dateKeyLocal(0)
    const localMorningDone = localStorage.getItem('somnia_morning_entry_date') === today
    const localSeedPlanted = localStorage.getItem('somnia_seed_planted_date') === today

    const trialActive = Boolean(sourceProfile?.trial_ends_at) && new Date(sourceProfile?.trial_ends_at ?? '').getTime() > Date.now()
    const userIsPro = sourceProfile?.tier === 'pro' || trialActive

    // Fast-path redirect using local cache and local completion flags.
    if (nowTotal >= morningStart && nowTotal <= morningEnd && !localMorningDone) {
      window.location.href = '/morning'
      return
    }

    if (nowTotal >= eveningStart && nowTotal <= eveningEnd && userIsPro && !localSeedPlanted) {
      window.location.href = '/evening'
      return
    }

    if (!user?.id) return

    // Fallback verification against fresh DB state if local flags are missing or stale.
    const supabase = createClient()
    void Promise.all([
      supabase
        .from('dreams')
        .select('id')
        .eq('user_id', user.id)
        .eq('date_of_dream', today)
        .maybeSingle(),
      supabase
        .from('dream_seeds')
        .select('id')
        .eq('user_id', user.id)
        .eq('seed_date', today)
        .maybeSingle(),
    ]).then(([dreamResult, seedResult]) => {
      const morningEntryDoneToday = Boolean(dreamResult.data)
      const seedPlantedToday = Boolean(seedResult.data)

      if (morningEntryDoneToday) {
        localStorage.setItem('somnia_morning_entry_date', today)
      }
      if (seedPlantedToday) {
        localStorage.setItem('somnia_seed_planted_date', today)
      }

      if (nowTotal >= morningStart && nowTotal <= morningEnd && !morningEntryDoneToday) {
        window.location.href = '/morning'
        return
      }

      if (nowTotal >= eveningStart && nowTotal <= eveningEnd && userIsPro && !seedPlantedToday) {
        window.location.href = '/evening'
      }
    })
  }, [pathname, profile, user])

  return null
}
