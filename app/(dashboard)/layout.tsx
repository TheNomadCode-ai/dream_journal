import { redirect } from 'next/navigation'

import DashboardShell from '@/components/navigation/DashboardShell'
import { createClient } from '@/lib/supabase/server'

// Moon phase glyphs cycling by week
const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

function getMoonPhase() {
  const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 3.7)) % 8
  return MOON_PHASES[week]
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('home_screen_installed')
    .eq('id', user.id)
    .single()

  const initials = (user.email ?? 'D').slice(0, 2).toUpperCase()
  const moon = getMoonPhase()

  return (
    <DashboardShell
      userEmail={user.email?.split('@')[0] ?? 'user'}
      initials={initials}
      moon={moon}
      homeScreenInstalled={Boolean(profile?.home_screen_installed)}
    >
      {children}
    </DashboardShell>
  )
}
