import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from '@/types/database'

export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: { id: string; email?: string } | null; hasEnabledAlarm: boolean }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Apply cookies to both the request and response so the session
          // propagates correctly through the middleware chain.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — IMPORTANT: do not add any logic between
  // createServerClient and getUser that might cause early returns.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasEnabledAlarm = false

  if (user) {
    const { data: alarmRow } = await supabase
      .from('alarms')
      .select('id')
      .eq('user_id', user.id)
      .eq('enabled', true)
      .limit(1)
      .maybeSingle()

    hasEnabledAlarm = !!alarmRow
  }

  return { response: supabaseResponse, user, hasEnabledAlarm }
}
