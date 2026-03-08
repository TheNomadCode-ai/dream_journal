'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

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

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id

    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, target_wake_time, target_sleep_time, onboarding_complete, home_screen_installed, tier, chronotype, streak_freezes_remaining, streak_freeze_reset_date')
      .eq('id', userId)
      .maybeSingle()

    setProfile(data ?? null)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const value = useMemo(() => ({ profile, setProfile, refreshProfile, loading }), [profile, refreshProfile, loading])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}
