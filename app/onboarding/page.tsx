import { redirect } from 'next/navigation'

import OnboardingAlarmSetup from '@/components/onboarding/OnboardingAlarmSetup'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Fonboarding')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_complete) {
    redirect('/dashboard')
  }

  const { data: alarm } = await supabase
    .from('alarms')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (alarm) {
    redirect('/dashboard')
  }

  return <OnboardingAlarmSetup />
}
