import { NextResponse, type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/',
  '/privacy',
  '/terms',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
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
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Static assets and Next.js internals — skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response
  }

  // User is authenticated and tries to access login/signup — redirect to dashboard
  if (user && isAuthRoute(pathname)) {
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
