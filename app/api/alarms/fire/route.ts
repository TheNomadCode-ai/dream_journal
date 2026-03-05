/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { fireAlarmForUser, localAlarmContext, parseAlarmTime } from '@/lib/alarm-capture'
import { createServiceClient } from '@/lib/supabase/server'

const fireSchema = z.object({
  userId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  localTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  localDayOfWeek: z.number().int().min(1).max(7).optional(),
})

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const headerSecret = request.headers.get('x-cron-secret')
  const bearer = request.headers.get('authorization')
  const bearerSecret = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null
  return !!secret && (secret === headerSecret || secret === bearerSecret)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const parsed = fireSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { userId, localDate, localTime, localDayOfWeek } = parsed.data
  const supabase = createServiceClient() as any

  const { data: alarm, error: alarmError } = await supabase
    .from('alarms')
    .select('alarm_time, enabled, days_of_week')
    .eq('user_id', userId)
    .maybeSingle()

  if (alarmError) {
    return NextResponse.json({ error: alarmError.message }, { status: 500 })
  }

  if (!alarm || !alarm.enabled) {
    return NextResponse.json({ skipped: true, reason: 'alarm-disabled' })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, wake_timezone')
    .eq('id', userId)
    .maybeSingle()

  const timezone = profile?.timezone || profile?.wake_timezone || 'UTC'
  const nowContext = localAlarmContext(timezone)
  const expectedTime = localTime ?? nowContext.localTime
  const expectedDay = localDayOfWeek ?? nowContext.localDayOfWeek
  const expectedDate = localDate ?? nowContext.localDate

  const alarmTime = parseAlarmTime(alarm.alarm_time)

  if (alarmTime !== expectedTime) {
    return NextResponse.json({ skipped: true, reason: 'time-mismatch' })
  }

  if (!alarm.days_of_week.includes(expectedDay)) {
    return NextResponse.json({ skipped: true, reason: 'day-mismatch' })
  }

  const fired = await fireAlarmForUser({
    userId,
    localDate: expectedDate,
    supabase,
  })

  return NextResponse.json(fired)
}
