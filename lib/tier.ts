import { createClient } from '@/lib/supabase/server'
import { normalizeTier, type Tier } from '@/lib/tier-config'

export type { Tier } from '@/lib/tier-config'
export { isPro, LIMITS, PRO_UPGRADE_URL } from '@/lib/tier-config'

export async function getUserTier(): Promise<Tier> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle()

  return normalizeTier(data?.tier)
}

export async function getUserTierForUserId(userId: string): Promise<Tier> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .maybeSingle()

  return normalizeTier(data?.tier)
}
