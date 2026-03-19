import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback
 *
 * Handles Supabase Auth redirects for:
 * - Magic link logins
 * - Email confirmation (signup)
 * - OAuth provider callbacks (Google, etc.)
 *
 * Supabase appends a `code` query param. We exchange it for a session,
 * then redirect to the intended destination (or /dashboard).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  void next

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
}
