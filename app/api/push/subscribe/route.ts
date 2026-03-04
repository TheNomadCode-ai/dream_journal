import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('user_profiles')
    .update({
      push_enabled: true,
      push_subscription: subscription,
      wake_time: wakeTime,
      wake_timezone: wakeTimezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
