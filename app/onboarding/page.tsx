import { redirect } from 'next/navigation'

import OnboardingAlarmSetup from '@/components/onboarding/OnboardingAlarmSetup'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Fonboarding')
  }

  const { data: alarm } = await supabase
    .from('alarms')
    .select('id')
    .eq('user_id', user.id)
    .eq('enabled', true)
    .limit(1)
    .maybeSingle()

  if (alarm) {
    redirect('/dashboard')
  }

  return <OnboardingAlarmSetup />
}
