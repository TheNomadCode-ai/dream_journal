import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import DashboardShell from '@/components/navigation/DashboardShell'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, trial_ends_at')
    .eq('id', user.id)
    .maybeSingle()

  const isPro = profile?.tier === 'pro' || profile?.tier === 'lifetime'
  const isTrialing =
    profile?.tier === 'free' &&
    Boolean(profile?.trial_ends_at) &&
    new Date(profile?.trial_ends_at ?? '').getTime() > Date.now()

  const initials = (user.email ?? 'D').slice(0, 2).toUpperCase()

  return (
    <DashboardShell
      userEmail={user.email?.split('@')[0] ?? 'user'}
      initials={initials}
      isPro={isPro}
      isTrialing={isTrialing}
    >
      {children}
    </DashboardShell>
  )
}
