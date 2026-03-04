import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2'

type PushProfile = {
  id: string
  wake_time: string | null
  wake_timezone: string | null
  push_subscription: webpush.PushSubscription | null
  last_push_sent_at: string | null
}

function getTimeParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const parts = formatter.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  }
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@somnia.app'

    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'Missing push env vars' }), { status: 500 })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, wake_time, wake_timezone, push_subscription, last_push_sent_at')
      .eq('push_enabled', true)
      .not('wake_time', 'is', null)
      .not('push_subscription', 'is', null)

    if (error) {
      throw error
    }

    const now = new Date()
    let sent = 0

    for (const profile of (profiles ?? []) as PushProfile[]) {
      if (!profile.wake_time || !profile.push_subscription) continue

      const zone = profile.wake_timezone || 'UTC'
      const localNow = getTimeParts(now, zone)
      const wakeTime = profile.wake_time.slice(0, 5)

      if (wakeTime !== localNow.time) {
        continue
      }

      if (profile.last_push_sent_at) {
        const lastDate = getTimeParts(new Date(profile.last_push_sent_at), zone).date
        if (lastDate === localNow.date) {
          continue
        }
      }

      const payload = JSON.stringify({
        title: 'Somnia',
        body: 'Your dreams are fading. You have 60 seconds.',
        url: '/dreams/new?from=notification',
      })

      try {
        await webpush.sendNotification(profile.push_subscription, payload)

        await supabase
          .from('user_profiles')
          .update({
            last_push_sent_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', profile.id)

        sent += 1
      } catch {
        await supabase
          .from('user_profiles')
          .update({
            push_enabled: false,
            updated_at: now.toISOString(),
          })
          .eq('id', profile.id)
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
