import { redirect } from 'next/navigation'

import SeedInsightsClient from '@/components/insights/SeedInsightsClient'
import { createClient } from '@/lib/supabase/server'

export default async function InsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, seedsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('dream_seeds')
      .select('seed_text, seed_date, was_dreamed, created_at')
      .eq('user_id', user.id)
      .order('seed_date', { ascending: false })
      .limit(180),
  ])

  return <SeedInsightsClient tier={profileResult.data?.tier ?? 'free'} seeds={(seedsResult.data ?? []) as any} />
}
