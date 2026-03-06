export function canShowUpgradePrompt(featureKey: string): boolean {
  if (typeof window === 'undefined') return true

  const key = `somnia_upgrade_prompt_seen:${featureKey}`
  return window.sessionStorage.getItem(key) !== '1'
}

export function markUpgradePromptSeen(featureKey: string): void {
  if (typeof window === 'undefined') return

  const key = `somnia_upgrade_prompt_seen:${featureKey}`
  window.sessionStorage.setItem(key, '1')
}
