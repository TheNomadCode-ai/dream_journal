export const FALLBACK_APP_URL = 'https://dream-journal-b8wl.vercel.app'

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL
}
