import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

import { createServiceClient } from '@/lib/supabase/server'

type PushSubRow = {
  user_id: string
  subscription: webpush.PushSubscription
  updated_at: string
}

type ProfileRow = {
  id: string
  target_wake_time: string | null
  target_sleep_time: string | null
}

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const CRON_SECRET = process.env.CRON_SECRET

function formatTime(totalMinutes: number) {
  const day = 24 * 60
  const normalized = ((totalMinutes % day) + day) % day
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient() as any

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const [{ data: profiles, error: profileError }, { data: subs, error: subError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,target_wake_time,target_sleep_time'),
    supabase
      .from('push_subscriptions')
      .select('user_id,subscription,updated_at'),
  ])

  if (profileError || subError) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }

  const profileRows = (profiles ?? []) as ProfileRow[]
  const subRows = (subs ?? []) as PushSubRow[]

  if (profileRows.length === 0 || subRows.length === 0) {
    return NextResponse.json({ sent: 0, time: currentTime })
  }

  const subsByUser = new Map<string, PushSubRow>()
  for (const row of subRows) {
    subsByUser.set(row.user_id, row)
  }

  let sent = 0
  const errors: string[] = []

  for (const user of profileRows) {
    const sub = subsByUser.get(user.id)
    if (!sub) continue

    const wake = user.target_wake_time ?? '07:00:00'
    const sleep = user.target_sleep_time ?? '23:00:00'

    const [wakeH, wakeM] = wake.split(':').map(Number)
    const [sleepH, sleepM] = sleep.split(':').map(Number)

    const wakeTotal = wakeH * 60 + wakeM
    const sleepTotal = sleepH * 60 + sleepM

    const morningTime = formatTime(wakeTotal - 120)
    const eveningTime = formatTime(sleepTotal - 10)

    let payload: string | null = null

    if (currentTime === morningTime) {
      payload = JSON.stringify({
        title: 'Somnia',
        body: 'Your morning window is open. Write before it fades.',
        url: '/morning',
        tag: 'morning',
      })
    }

    if (currentTime === eveningTime) {
      payload = JSON.stringify({
        title: 'Somnia',
        body: 'Your planting window is open. What do you want to dream tonight?',
        url: '/evening',
        tag: 'evening',
      })
    }

    if (!payload) continue

    try {
      await webpush.sendNotification(sub.subscription, payload)
      sent++
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
      }
      errors.push(err?.message ?? 'Unknown push error')
    }
  }

  return NextResponse.json({ sent, errors, time: currentTime })
}
