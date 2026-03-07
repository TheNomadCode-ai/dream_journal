/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

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

    const alarmRow = {
      user_id: user.id,
      alarm_time: `${alarm.alarm_time}:00`,
      enabled: alarm.enabled,
      days_of_week: alarm.days_of_week,
      snooze_seconds: alarm.snooze_seconds,
    }

    const { data, error } = await supabase
      .from('alarms')
      .upsert(alarmRow, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      console.error('Alarm insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: profile, error: profileFetchError } = await supabase
      .from('user_profiles')
      .select('timezone, wake_timezone')
      .eq('id', user.id)
      .maybeSingle()

    if (profileFetchError) {
      console.error('Profile read error during alarm save:', profileFetchError)
    }

    const timezone = alarm.timezone ?? profile?.timezone ?? profile?.wake_timezone ?? 'UTC'

    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        wake_time: `${alarm.alarm_time}:00`,
        wake_timezone: timezone,
        timezone,
        push_enabled: alarm.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Profile update error during alarm save:', profileUpdateError)
    }

    return NextResponse.json({ alarm: data })
  } catch (err) {
    console.error('Alarm API crashed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
