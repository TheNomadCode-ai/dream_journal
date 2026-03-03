'use client'

import { useEffect, useState } from 'react'

import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error
        setUser(user)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get user'))
      } finally {
        setLoading(false)
      }
    }

    void getUser()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
