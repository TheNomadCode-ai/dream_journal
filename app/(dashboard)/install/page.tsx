import { redirect } from 'next/navigation'

import InstallGate from '@/components/install/InstallGate'
import { createClient } from '@/lib/supabase/server'

export default async function InstallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Finstall')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_wake_time, target_sleep_time, home_screen_installed')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <InstallGate
      targetWakeTime={profile?.target_wake_time ?? '07:00:00'}
      targetSleepTime={profile?.target_sleep_time ?? '23:00:00'}
      homeScreenInstalled={Boolean(profile?.home_screen_installed)}
    />
  )
}
