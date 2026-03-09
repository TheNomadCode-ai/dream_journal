'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { ContextualLoader } from '@/components/ContextualLoader'
import { cacheProfile, getCachedProfile } from '@/lib/profile-cache'
import { createClient } from '@/lib/supabase/client'

export type AppProfile = {
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
  total_seeds_planted: number | null
  total_seeds_dreamed: number | null
  trial_ends_at: string | null
  notification_permission_granted: boolean | null
  last_seed_date: string | null
} | null

type AuthUser = {
  id: string
  email?: string
} | null

type AppContextValue = {
  profile: AppProfile
  user: AuthUser
  loading: boolean
  refreshProfile: () => Promise<void>
  setProfile: (value: AppProfile | ((current: AppProfile) => AppProfile)) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfileState] = useState<AppProfile>(() => getCachedProfile<AppProfile>())
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(!getCachedProfile<AppProfile>())

  const setProfile = useCallback((value: AppProfile | ((current: AppProfile) => AppProfile)) => {
    setProfileState((current) => {
      const next = typeof value === 'function' ? (value as (current: AppProfile) => AppProfile)(current) : value
      if (next) cacheProfile(next)
      return next
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user

    if (!currentUser) {
      setUser(null)
      setProfileState(null)
      setLoading(false)
      return
    }

    setUser(
      currentUser.email
        ? { id: currentUser.id, email: currentUser.email }
        : { id: currentUser.id }
    )

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (data) {
      setProfileState(data)
      cacheProfile(data)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const value = useMemo(() => ({ profile, user, loading, refreshProfile, setProfile }), [loading, profile, refreshProfile, setProfile, user])

  if (loading) {
    return <ContextualLoader />
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }

  return context
}
