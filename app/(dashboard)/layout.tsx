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

  const initials = (user.email ?? 'D').slice(0, 2).toUpperCase()

  return (
    <DashboardShell
      userEmail={user.email?.split('@')[0] ?? 'user'}
      initials={initials}
    >
      {children}
    </DashboardShell>
  )
}
