import { NextResponse, type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/blog',
]

const AUTH_ROUTES = ['/login', '/signup']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  // Refresh the session and get updated response + user
  const { response, user, hasEnabledAlarm } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api')

  // Static assets and Next.js internals — skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response
  }

  // Blog is fully public, including /blog/[slug]
  if (pathname.startsWith('/blog')) {
    return response
  }

  // Force onboarding until a wake-up alarm is configured.
  if (
    user
    && !hasEnabledAlarm
    && pathname !== '/onboarding'
    && !pathname.startsWith('/auth/callback')
    && !isApiRoute
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (user && hasEnabledAlarm && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // User is authenticated and tries to access login/signup — redirect to dashboard
  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // User is authenticated and visits the landing page — redirect to dashboard
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // User is NOT authenticated and tries to access a protected route
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
