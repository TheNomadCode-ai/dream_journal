import { createClient } from '@/lib/supabase/server'

export const FREE_FEATURES = [
  'dream_journal',
  'morning_capture',
  'dream_archive',
  'streak',
  'search',
] as const

export const PRO_FEATURES = [
  'seed_planting',
  'seed_insights',
  'ai_suggestions',
  'weekly_digest',
  'notebooks_unlimited',
] as const

export type EffectiveTier = 'free' | 'pro'

export async function getUserTier(userId: string): Promise<EffectiveTier> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('tier, trial_ends_at')
    .eq('id', userId)
    .maybeSingle()

  if (data?.trial_ends_at) {
    const trialEnd = new Date(data.trial_ends_at)
    if (trialEnd > new Date()) {
      return 'pro'
    }
  }

  return data?.tier === 'pro' ? 'pro' : 'free'
}

export function isPro(tier: string): boolean {
  return tier === 'pro'
}
