import InsightsDashboardClient from '@/components/insights/InsightsDashboardClient'
import { createClient } from '@/lib/supabase/server'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime'

  return <InsightsDashboardClient isPro={isPro} />
}
