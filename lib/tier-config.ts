export type Tier = 'free' | 'pro' | 'lifetime'

export const PRO_UPGRADE_URL = 'https://sushankhanal.gumroad.com/l/somniavault'

export const LIMITS = {
  free: {
    maxNotebooks: 1,
    aiInsights: false,
    voiceCapture: false,
    fullInsights: false,
    weeklyDigest: false,
  },
  pro: {
    maxNotebooks: Number.POSITIVE_INFINITY,
    aiInsights: true,
    voiceCapture: true,
    fullInsights: true,
    weeklyDigest: true,
  },
  lifetime: {
    maxNotebooks: Number.POSITIVE_INFINITY,
    aiInsights: true,
    voiceCapture: true,
    fullInsights: true,
    weeklyDigest: true,
  },
} as const

export function isPro(tier: Tier): boolean {
  return tier === 'pro' || tier === 'lifetime'
}

export function normalizeTier(value: string | null | undefined): Tier {
  if (value === 'pro' || value === 'lifetime' || value === 'free') {
    return value
  }

  return 'free'
}
