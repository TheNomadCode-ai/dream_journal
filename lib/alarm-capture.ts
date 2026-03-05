import webpush from 'web-push'

import { createServiceClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database'

export const ENTRY_WINDOW_SECONDS = 120

type ServiceClient = ReturnType<typeof createServiceClient>

export type AlarmFireResult = {
  windowId: string | null
  skipped: boolean
  reason?: string
}

function dateParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  const weekday = part('weekday')

  return {
    localDate: `${part('year')}-${part('month')}-${part('day')}`,
    localTime: `${part('hour')}:${part('minute')}`,
    localDayOfWeek: weekdayMap[weekday] ?? 1,
  }
}

export function localAlarmContext(timeZone: string, now = new Date()) {
  return dateParts(now, timeZone)
}

export function parseAlarmTime(alarmTime: string) {
  return alarmTime.slice(0, 5)
}

function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
}

function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY || ''
}

function getVapidEmail() {
  return process.env.VAPID_EMAIL || process.env.VAPID_SUBJECT || 'mailto:support@somnia.app'
}

function configureWebPush() {
  const publicKey = getVapidPublicKey()
  const privateKey = getVapidPrivateKey()

  if (!publicKey || !privateKey) {
    throw new Error('Missing VAPID keys for push notifications')
  }

  webpush.setVapidDetails(getVapidEmail(), publicKey, privateKey)
}

export async function dispatchAlarmPushes(userId: string, windowId: string, supabase: ServiceClient) {
  configureWebPush()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) return

  const payload = JSON.stringify({
    title: 'Somnia — Wake up',
    body: 'What did you dream? 2 minutes before it fades.',
    windowId,
  })

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
      } catch {
        await supabase.from('push_subscriptions').delete().eq('id', row.id)
      }
    })
  )
}

export async function fireAlarmForUser(options: {
  userId: string
  localDate: string
  supabase?: ServiceClient
}) {
  const supabase = options.supabase ?? createServiceClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ENTRY_WINDOW_SECONDS * 1000)

  const windowPayload: Database['public']['Tables']['entry_windows']['Insert'] = {
    user_id: options.userId,
    window_date: options.localDate,
    window_opened_at: now.toISOString(),
    window_expires_at: expiresAt.toISOString(),
    entry_started: false,
    locked: false,
  }

  const { data: inserted, error } = await supabase
    .from('entry_windows')
    .insert(windowPayload)
    .select('id')
    .single()

  if (error || !inserted) {
    const duplicate = error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate')
    return {
      windowId: null,
      skipped: true,
      reason: duplicate ? 'already-fired' : error?.message ?? 'create-window-failed',
    } satisfies AlarmFireResult
  }

  await dispatchAlarmPushes(options.userId, inserted.id, supabase)

  return {
    windowId: inserted.id,
    skipped: false,
  } satisfies AlarmFireResult
}

export function textFromBodyJson(bodyJson: Json): string {
  if (!bodyJson || typeof bodyJson !== 'object') return ''
  const collector: string[] = []

  const walk = (node: Json) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (typeof node.text === 'string') {
      collector.push(node.text)
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }

  walk(bodyJson)
  return collector.join(' ').replace(/\s+/g, ' ').trim()
}

export function formatNextAlarmLabel(alarmTime: string) {
  const [hour, minute] = parseAlarmTime(alarmTime).split(':').map((value) => parseInt(value, 10))
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
