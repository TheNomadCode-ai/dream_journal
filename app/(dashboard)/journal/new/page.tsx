import { redirect } from 'next/navigation'

import JournalWindowClient from '@/components/journal/JournalWindowClient'
import { createClient } from '@/lib/supabase/server'

function calculateScore(minutes: number[]) {
  if (!minutes.length) return 0
  const avg = minutes.reduce((sum, value) => sum + Math.abs(value), 0) / minutes.length
  if (avg <= 5) return 100
  if (avg <= 10) return 90
  if (avg <= 15) return 80
  if (avg <= 20) return 70
  if (avg <= 30) return 55
  if (avg <= 45) return 40
  return 20
}

function calculateStreak(logDates: string[]) {
  const set = new Set(logDates)
  let streak = 0
  const cursor = new Date()

  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export default async function JournalNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Fjournal%2Fnew')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('target_wake_time')
    .eq('id', user.id)
    .maybeSingle()

  const { data: logs } = await supabase
    .from('wake_logs')
    .select('log_date, minutes_from_target')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(7)

  const minutes = (logs ?? []).map((row) => row.minutes_from_target ?? 0)
  const streak = calculateStreak((logs ?? []).map((row) => row.log_date))

  return (
    <JournalWindowClient
      userId={user.id}
      targetWakeTime={profile?.target_wake_time ?? '07:00:00'}
      streak={streak}
      bioClockScore={calculateScore(minutes)}
    />
  )
}
