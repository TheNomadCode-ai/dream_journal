import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/privacy', '/terms']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/blog')) return true
  if (pathname.startsWith('/auth')) return true
  if (pathname.startsWith('/api')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/sitemap')) return true
  if (pathname.startsWith('/robots')) return true
  if (pathname.includes('.')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { response, user } = await updateSession(request)

  if (isPublicPath(pathname)) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }: any) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete, home_screen_installed, notification_permission_granted, target_wake_time, target_sleep_time')
    .eq('id', user.id)
    .maybeSingle()

  const onboardingComplete = Boolean(profile?.onboarding_complete)
  const homeScreenInstalled = Boolean(profile?.home_screen_installed)
  const notificationGranted = Boolean(profile?.notification_permission_granted)
  const hasSchedule = Boolean(profile?.target_wake_time && profile?.target_sleep_time)

  const isOnboardingPath = pathname === '/onboarding'
  const isInstallPath = pathname === '/install'
  const isNotifyPath = pathname === '/notify'

  // Completed users should never revisit onboarding/install/notify pages.
  if (onboardingComplete && (isOnboardingPath || isInstallPath || isNotifyPath)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Incomplete users must follow strict sequence:
  // /onboarding -> /install -> /notify -> /dashboard
  if (!onboardingComplete) {
    if (!hasSchedule && !isOnboardingPath) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (hasSchedule && !homeScreenInstalled && !isInstallPath) {
      return NextResponse.redirect(new URL('/install', request.url))
    }

    if (hasSchedule && homeScreenInstalled && !notificationGranted && !isNotifyPath) {
      return NextResponse.redirect(new URL('/notify', request.url))
    }

    if (hasSchedule && homeScreenInstalled && notificationGranted) {
      if (!isNotifyPath) return NextResponse.redirect(new URL('/notify', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
