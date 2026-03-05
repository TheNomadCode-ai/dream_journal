/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'

import { fireAlarmForUser, localAlarmContext, parseAlarmTime } from '@/lib/alarm-capture'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const headerSecret = request.headers.get('x-cron-secret')
  const bearer = request.headers.get('authorization')
  const bearerSecret = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null
  return !!secret && (secret === headerSecret || secret === bearerSecret)
}

type AlarmRow = {
  user_id: string
  alarm_time: string
  enabled: boolean
  days_of_week: number[]
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient() as any

  const { data: alarms, error } = await supabase
    .from('alarms')
    .select('user_id, alarm_time, enabled, days_of_week')
    .eq('enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const uniqueUserIds = [...new Set((alarms ?? []).map((alarm: AlarmRow) => alarm.user_id))]

  if (uniqueUserIds.length === 0) {
    return NextResponse.json({ ok: true, fired: 0, skipped: 0 })
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, timezone, wake_timezone')
    .in('id', uniqueUserIds)

  const timezoneMap = new Map<string, string>()
  ;(profiles ?? []).forEach((profile: { id: string; timezone?: string | null; wake_timezone?: string | null }) => {
    timezoneMap.set(profile.id, profile.timezone || profile.wake_timezone || 'UTC')
  })

  let fired = 0
  let skipped = 0
  const skippedDetails: Array<{ userId: string; reason: string }> = []

  for (const alarm of (alarms ?? []) as AlarmRow[]) {
    const timezone = timezoneMap.get(alarm.user_id) || 'UTC'
    const context = localAlarmContext(timezone)
    const alarmTime = parseAlarmTime(alarm.alarm_time)

    if (alarmTime !== context.localTime) {
      skipped += 1
      skippedDetails.push({ userId: alarm.user_id, reason: 'time-mismatch' })
      continue
    }

    if (!alarm.days_of_week.includes(context.localDayOfWeek)) {
      skipped += 1
      skippedDetails.push({ userId: alarm.user_id, reason: 'day-mismatch' })
      continue
    }

    const result = await fireAlarmForUser({
      userId: alarm.user_id,
      localDate: context.localDate,
      supabase,
    })

    if (result.skipped) {
      skipped += 1
      skippedDetails.push({ userId: alarm.user_id, reason: result.reason ?? 'skipped' })
    } else {
      fired += 1
    }
  }

  return NextResponse.json({ ok: true, fired, skipped, skippedDetails })
}
