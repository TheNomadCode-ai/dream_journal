import InsightsDashboardClient from '@/components/insights/InsightsDashboardClient'
import { getUserTier, isPro } from '@/lib/tier'

export default async function InsightsPage() {
  const tier = await getUserTier()
  return <InsightsDashboardClient tier={tier} isPro={isPro(tier)} />
}
