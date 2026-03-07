import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type AlarmRequestBody = {
  alarm_time?: string
  enabled?: boolean
  days_of_week?: number[]
  snooze_seconds?: number
  timezone?: string
}

function normalizeAlarmTime(value?: string): string | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null
  return `${value}:00`
}

function normalizeDays(value?: number[]): number[] {
  if (!Array.isArray(value) || value.length === 0) return [1, 2, 3, 4, 5, 6, 7]
  return value
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    .filter((day, index, arr) => arr.indexOf(day) === index)
}

function normalizeSnooze(value?: number): 0 | 60 | 120 {
  if (value === 60 || value === 120) return value
  return 0
}

export async function GET() {
  const supabase = (await createClient()) as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(request: Request) {
  try {
    const supabase = (await createClient()) as any

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as AlarmRequestBody
    console.log('Alarm body received:', JSON.stringify(body))

    const alarmTime = normalizeAlarmTime(body.alarm_time)
    if (!alarmTime) {
      return NextResponse.json({ error: 'Invalid alarm_time. Expected HH:MM.' }, { status: 400 })
    }

    const days = normalizeDays(body.days_of_week)
    if (days.length === 0) {
      return NextResponse.json({ error: 'Invalid days_of_week.' }, { status: 400 })
    }

    const enabled = body.enabled ?? true
    const snoozeSeconds = normalizeSnooze(body.snooze_seconds)

    const alarmData = {
      user_id: user.id,
      alarm_time: alarmTime,
      enabled,
      days_of_week: days,
      snooze_seconds: snoozeSeconds,
    }

    console.log('Inserting alarm:', JSON.stringify(alarmData))

    const { data, error } = await supabase
      .from('alarms')
      .upsert(alarmData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    const timezone = body.timezone ?? 'UTC'
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        wake_time: alarmTime,
        wake_timezone: timezone,
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', JSON.stringify(profileError))
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Route crashed:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
