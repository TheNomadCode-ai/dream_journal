import { redirect } from 'next/navigation'

import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Fonboarding')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete, target_wake_time, target_sleep_time')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_complete) {
    redirect('/install')
  }

  return (
    <OnboardingFlow
      initialWakeTime={profile?.target_wake_time ?? '07:00:00'}
      initialSleepTime={profile?.target_sleep_time ?? '23:00:00'}
    />
  )
}
