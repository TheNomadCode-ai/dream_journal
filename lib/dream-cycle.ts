export type TimeParts = { hour: number; minute: number }

export type DreamSeedLite = {
  seed_date: string
  morning_confirmed_at: string | null
}

export function parseTime(value: string | null | undefined, fallback = '07:00:00'): TimeParts {
  const source = (value ?? fallback).slice(0, 5)
  const [hourRaw, minuteRaw] = source.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return { hour: 7, minute: 0 }
  }

  return { hour, minute }
}

export function formatClock(hour: number, minute: number) {
  return new Date(`1970-01-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function minusMinutes(hour: number, minute: number, delta: number): TimeParts {
  const total = ((hour * 60 + minute - delta) % 1440 + 1440) % 1440
  return { hour: Math.floor(total / 60), minute: total % 60 }
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export function windowForToday(hour: number, minute: number, durationMinutes = 5, now = new Date()) {
  const openedAt = new Date(now)
  openedAt.setHours(hour, minute, 0, 0)
  const expiresAt = addMinutes(openedAt, durationMinutes)
  const isOpen = now >= openedAt && now <= expiresAt
  const minutesRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 60000))
  const minutesUntilOpen = Math.ceil((openedAt.getTime() - now.getTime()) / 60000)

  return {
    openedAt,
    expiresAt,
    isOpen,
    minutesRemaining,
    minutesUntilOpen,
  }
}

export function dateKeyLocal(offsetDays = 0, now = new Date()) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function computeLoopStreak(rows: DreamSeedLite[]) {
  if (!rows.length) return 0

  const validDates = rows
    .filter((row) => Boolean(row.morning_confirmed_at))
    .map((row) => row.seed_date)
    .sort((a, b) => (a < b ? 1 : -1))

  if (!validDates.length) return 0

  let streak = 0
  let cursor = new Date(`${validDates[0]}T00:00:00`)

  for (const dateValue of validDates) {
    const current = new Date(`${dateValue}T00:00:00`)
    const diff = Math.round((cursor.getTime() - current.getTime()) / 86400000)

    if (streak === 0 && diff === 0) {
      streak = 1
      continue
    }

    if (diff === 1) {
      streak += 1
      cursor = current
      continue
    }

    break
  }

  return streak
}
