import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

import { createServiceClient } from '@/lib/supabase/server'

type PushSubRow = {
  user_id: string
  subscription: webpush.PushSubscription
  updated_at: string
  last_morning_sent: string | null
  last_evening_sent: string | null
}

type ProfileRow = {
  id: string
  target_wake_time: string | null
  target_sleep_time: string | null
  timezone: string | null
  wake_timezone: string | null
}

function formatTime(totalMinutes: number) {
  const day = 24 * 60
  const normalized = ((totalMinutes % day) + day) % day
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function normalizeMinutes(totalMinutes: number) {
  const day = 24 * 60
  return ((totalMinutes % day) + day) % day
}

function circularMinuteDistance(a: number, b: number) {
  const day = 24 * 60
  const diff = Math.abs(normalizeMinutes(a) - normalizeMinutes(b))
  return Math.min(diff, day - diff)
}

function isWithinMinuteWindow(currentMinutes: number, targetMinutes: number, windowMinutes = 1) {
  return circularMinuteDistance(currentMinutes, targetMinutes) <= windowMinutes
}

function getCurrentMinutesForTimezone(now: Date, timezone: string | null | undefined) {
  const resolvedTimezone = timezone || 'UTC'

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: resolvedTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
    const parts = formatter.formatToParts(now)
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

    return {
      timezone: resolvedTimezone,
      minutes: hour * 60 + minute,
    }
  } catch {
    return {
      timezone: 'UTC',
      minutes: now.getUTCHours() * 60 + now.getUTCMinutes(),
    }
  }
}

export async function POST(req: NextRequest) {
  console.log('Cron fired at:', new Date().toISOString())
  console.log('Server UTC time:', new Date().toISOString())

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    vapidPublicKey,
    vapidPrivateKey
  )

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient() as any

  const now = new Date()
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`

  const [{ data: profiles, error: profileError }, { data: subs, error: subError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,target_wake_time,target_sleep_time,timezone,wake_timezone'),
    supabase
      .from('push_subscriptions')
      .select('user_id,subscription,updated_at,last_morning_sent,last_evening_sent'),
  ])

  if (profileError || subError) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }

  const profileRows = (profiles ?? []) as ProfileRow[]
  const subRows = (subs ?? []) as PushSubRow[]

  console.log('Total profiles found:', profileRows.length)
  profileRows.forEach(p => {
    console.log('Profile:', p.id, 'sleep:', p.target_sleep_time, 'wake:', p.target_wake_time, 'timezone:', p.timezone, 'wake_timezone:', p.wake_timezone)
  })
  console.log('Subscriptions found:', subRows.length)

  if (profileRows.length === 0 || subRows.length === 0) {
    return NextResponse.json({ sent: 0, time: currentTime })
  }

  const subsByUser = new Map<string, PushSubRow>()
  for (const row of subRows) {
    subsByUser.set(row.user_id, row)
  }

  const eveningUsers = profileRows.filter(user => {
    const sleep = user.target_sleep_time ?? '23:00:00'
    const sleepTotal = parseTimeToMinutes(sleep)

    const timezones = [
      user.timezone,
      'Asia/Kathmandu',
      'UTC',
    ]

    return timezones.some(tz => {
      const { minutes } = getCurrentMinutesForTimezone(now, tz)
      return isWithinMinuteWindow(minutes, sleepTotal - 10)
    })
  })
  const morningUsers = profileRows.filter(user => {
    const wake = user.target_wake_time ?? '07:00:00'
    const wakeTotal = parseTimeToMinutes(wake)

    const timezones = [
      user.wake_timezone ?? user.timezone,
      'Asia/Kathmandu',
      'UTC',
    ]

    return timezones.some(tz => {
      const { minutes } = getCurrentMinutesForTimezone(now, tz)
      return isWithinMinuteWindow(minutes, wakeTotal - 120)
    })
  })
  console.log('Users in evening window:', eveningUsers.length)
  console.log('Users in morning window:', morningUsers.length)

  let sent = 0
  const errors: string[] = []

  for (const user of profileRows) {
    const sub = subsByUser.get(user.id)
    if (!sub) continue

    const wake = user.target_wake_time ?? '07:00:00'
    const sleep = user.target_sleep_time ?? '23:00:00'

    const wakeTotal = parseTimeToMinutes(wake)
    const sleepTotal = parseTimeToMinutes(sleep)
    const sleepTimezones = [
      user.timezone,
      'Asia/Kathmandu',
      'UTC',
    ]
    const wakeTimezones = [
      user.wake_timezone ?? user.timezone,
      'Asia/Kathmandu',
      'UTC',
    ]

    const morningTime = formatTime(wakeTotal - 120)
    const eveningTime = formatTime(sleepTotal - 10)
    const eveningWindowStart = eveningTime
    const isInEveningWindow = sleepTimezones.some(tz => {
      const { minutes } = getCurrentMinutesForTimezone(now, tz)
      return isWithinMinuteWindow(minutes, sleepTotal - 10)
    })
    const isInMorningWindow = wakeTimezones.some(tz => {
      const { minutes } = getCurrentMinutesForTimezone(now, tz)
      return isWithinMinuteWindow(minutes, wakeTotal - 120)
    })

    console.log('Profile sleep time:', user.target_sleep_time)
    console.log('Profile wake time:', user.target_wake_time)
    console.log('Profile timezone:', user.timezone)
    console.log('Profile wake timezone:', user.wake_timezone)
    console.log('Calculated evening window start:', eveningWindowStart)
    console.log('Is in evening window:', isInEveningWindow)

    const sentMorningRecently = sub.last_morning_sent
      ? now.getTime() - new Date(sub.last_morning_sent).getTime() < 60 * 60 * 1000
      : false
    const sentEveningRecently = sub.last_evening_sent
      ? now.getTime() - new Date(sub.last_evening_sent).getTime() < 60 * 60 * 1000
      : false

    let payload: string | null = null
    let sentType: 'morning' | 'evening' | null = null

    if (isInMorningWindow && !sentMorningRecently) {
      sentType = 'morning'
      payload = JSON.stringify({
        title: 'Somnia',
        body: 'Your morning window is open. Write before it fades.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [200, 100, 200],
        tag: 'somnia-morning',
        renotify: true,
        data: { url: '/morning' },
      })
    }

    if (isInEveningWindow && !sentEveningRecently) {
      sentType = 'evening'
      payload = JSON.stringify({
        title: 'Somnia',
        body: 'Your planting window is open. What do you want to dream tonight?',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [100, 50, 200],
        tag: 'somnia-evening',
        renotify: true,
        data: { url: '/evening' },
      })
    }

    if (!payload) continue

    try {
      await webpush.sendNotification(sub.subscription, payload)
      console.log('Push sent to:', user.id, sentType)
      if (sentType === 'morning') {
        await supabase.from('push_subscriptions').update({ last_morning_sent: now.toISOString() }).eq('user_id', user.id)
      } else if (sentType === 'evening') {
        await supabase.from('push_subscriptions').update({ last_evening_sent: now.toISOString() }).eq('user_id', user.id)
      }
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
