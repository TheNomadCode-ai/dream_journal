'use client'

import { useMemo } from 'react'

import { AppProvider, useApp } from '@/context/AppContext'

type Profile = {
  id: string
  full_name: string | null
  target_wake_time: string | null
  target_sleep_time: string | null
  onboarding_complete: boolean | null
  home_screen_installed: boolean | null
  tier: string | null
  chronotype: string | null
  streak_freezes_remaining: number | null
  streak_freeze_reset_date: string | null
} | null

type ProfileContextValue = {
  profile: Profile
  setProfile: (value: Profile | ((current: Profile) => Profile)) => void
  refreshProfile: () => Promise<void>
  loading: boolean
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}

export function useProfile() {
  const { profile, setProfile, refreshProfile, loading } = useApp()

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: profile as Profile,
      setProfile: setProfile as (value: Profile | ((current: Profile) => Profile)) => void,
      refreshProfile,
      loading,
    }),
    [loading, profile, refreshProfile, setProfile]
  )

  return value
}
