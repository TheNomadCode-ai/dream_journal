/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient, createServiceClient } from '@/lib/supabase/server'

const alarmSchema = z.object({
  alarm_time: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
  days_of_week: z.array(z.number().int().min(1).max(7)).min(1),
  snooze_seconds: z.union([z.literal(0), z.literal(60), z.literal(120)]),
  timezone: z.string().min(1).max(120).optional(),
})

export async function GET() {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alarm: data })
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

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (createServiceClient() as any)
      : supabase

    const body = await request.json()
    console.log('Alarm save body:', body)

    const parsed = alarmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const alarm = parsed.data
    const timeValue = `${alarm.alarm_time}:00`

    // Check whether an alarm row already exists for this user
    const { data: existing, error: selectError } = await db
      .from('alarms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) {
      console.error('Alarm select error:', selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    let writeError
    if (existing) {
      const { error } = await db
        .from('alarms')
        .update({
          alarm_time: timeValue,
          enabled: alarm.enabled,
          days_of_week: alarm.days_of_week,
          snooze_seconds: alarm.snooze_seconds,
        })
        .eq('user_id', user.id)
      writeError = error
    } else {
      const { error } = await db
        .from('alarms')
        .insert({
          user_id: user.id,
          alarm_time: timeValue,
          enabled: alarm.enabled,
          days_of_week: alarm.days_of_week,
          snooze_seconds: alarm.snooze_seconds,
        })
      writeError = error
    }

    if (writeError) {
      console.error('Alarm write error:', writeError)
      return NextResponse.json({ error: writeError.message }, { status: 500 })
    }

    // Read back the saved alarm
    const { data: saved } = await db
      .from('alarms')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Update profile with wake time (best-effort, don't block on failure)
    const timezone = alarm.timezone ?? 'UTC'

    await db
      .from('user_profiles')
      .update({
        wake_time: timeValue,
        wake_timezone: timezone,
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .then(({ error: e }: { error: unknown }) => e && console.error('Profile update error:', e))

    return NextResponse.json({ alarm: saved })
  } catch (err) {
    console.error('Alarm API crashed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
