export function isWindowOpen(targetWakeTime: string): { open: boolean; secondsRemaining: number } {
  const now = new Date()
  const [hour, minute] = targetWakeTime.split(':').map(Number)

  const target = new Date()
  target.setHours(hour, minute, 0, 0)

  const diffMs = now.getTime() - target.getTime()
  const diffMinutes = diffMs / 1000 / 60

  const open = diffMinutes >= -2 && diffMinutes <= 5
  const secondsRemaining = open ? Math.max(0, Math.floor((5 - diffMinutes) * 60)) : 0

  return { open, secondsRemaining }
}
