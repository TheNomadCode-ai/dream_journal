import { NextResponse } from 'next/server'

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
export async function GET(request: Request) {
  const url = new URL(request.url)
  const { searchParams, origin, pathname } = url
  const authType = searchParams.get('type')

  // Always complete auth on the canonical host so session cookies are scoped correctly.
  if (url.hostname === 'somniavault.me') {
    const canonicalUrl = new URL(`https://www.somniavault.me${pathname}`)
    canonicalUrl.search = searchParams.toString()
    return NextResponse.redirect(canonicalUrl.toString())
  }

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    // Reused or stale signup confirmation links should guide users to sign in.
    if (authType === 'signup') {
      return NextResponse.redirect(
        `${origin}/login?message=already_confirmed`
      )
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  )
}
