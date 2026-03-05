import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

const bodySchema = z.object({
  subscription: subscriptionSchema,
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  wakeTimezone: z.string().min(1).max(120).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { subscription, wakeTime, wakeTimezone } = parsed.data
  const endpoint = subscription.endpoint

  const { data: existingRows, error: existingError } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', user.id)

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const matching = (existingRows ?? []).find((row) => {
    const current = row.subscription as { endpoint?: string }
    return current.endpoint === endpoint
  })

  if (matching) {
    const { error: updateSubError } = await supabase
      .from('push_subscriptions')
      .update({ subscription: subscription as Json })
      .eq('id', matching.id)

    if (updateSubError) {
      return NextResponse.json({ error: updateSubError.message }, { status: 500 })
    }
  } else {
    const { error: insertSubError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        subscription: subscription as Json,
      })

    if (insertSubError) {
      return NextResponse.json({ error: insertSubError.message }, { status: 500 })
    }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      push_enabled: true,
      push_subscription: subscription as Json,
      wake_time: wakeTime,
      wake_timezone: wakeTimezone,
      timezone: wakeTimezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
