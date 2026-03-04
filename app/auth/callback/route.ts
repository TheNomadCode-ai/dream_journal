import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/app-url'

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
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin ?? getAppUrl()

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Sanitise the redirect target — only allow relative paths to prevent
  // open redirect attacks.
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${safeNext}`)
    }

    // Exchange failed — redirect to login with an error hint
    return NextResponse.redirect(
      `${baseUrl}/login?error=auth_callback_failed`
    )
  }

  // No code present — redirect to login
  return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
}
