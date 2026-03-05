/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'

import { formatNextAlarmLabel, localAlarmContext } from '@/lib/alarm-capture'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const windowId = searchParams.get('window_id')

  let windowQuery = supabase
    .from('entry_windows')
    .select('id, user_id, window_date, window_opened_at, window_expires_at, entry_started, entry_id, locked')
    .eq('user_id', user.id)

  if (windowId) {
    windowQuery = windowQuery.eq('id', windowId)
  } else {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone, wake_timezone')
      .eq('id', user.id)
      .maybeSingle()

    const timezone = profile?.timezone || profile?.wake_timezone || 'UTC'
    const localDate = localAlarmContext(timezone).localDate
    windowQuery = windowQuery.eq('window_date', localDate)
  }

  const { data: windowRow, error } = await windowQuery.order('window_opened_at', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!windowRow) {
    const { data: alarm } = await supabase
      .from('alarms')
      .select('alarm_time, enabled')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!alarm || !alarm.enabled) {
      return NextResponse.json({ allowed: false, reason: 'no_alarm' })
    }

    return NextResponse.json({
      allowed: false,
      reason: 'no_active_window',
      next_alarm_label: formatNextAlarmLabel(alarm.alarm_time),
    })
  }

  if (windowRow.entry_id) {
    return NextResponse.json({
      allowed: false,
      reason: 'already_captured',
      dream_id: windowRow.entry_id,
      window_id: windowRow.id,
    })
  }

  if (windowRow.locked) {
    return NextResponse.json({ allowed: false, reason: 'locked' })
  }

  const now = Date.now()
  const expires = new Date(windowRow.window_expires_at).getTime()

  if (now > expires && !windowRow.entry_started) {
    await supabase
      .from('entry_windows')
      .update({ locked: true })
      .eq('id', windowRow.id)
      .eq('user_id', user.id)

    return NextResponse.json({ allowed: false, reason: 'expired' })
  }

  if (windowRow.entry_started) {
    return NextResponse.json({
      allowed: true,
      started: true,
      window_id: windowRow.id,
    })
  }

  const secondsRemaining = Math.max(0, Math.floor((expires - now) / 1000))

  return NextResponse.json({
    allowed: true,
    started: false,
    seconds_remaining: secondsRemaining,
    window_id: windowRow.id,
  })
}
