/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const startSchema = z.object({
  window_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const parsed = startSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { window_id } = parsed.data

  const { data: windowRow, error } = await supabase
    .from('entry_windows')
    .select('id, user_id, window_expires_at, entry_started, locked, entry_id')
    .eq('id', window_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!windowRow) {
    return NextResponse.json({ error: 'Window not found' }, { status: 404 })
  }

  if (windowRow.entry_id) {
    return NextResponse.json({ error: 'Already captured today' }, { status: 409 })
  }

  if (windowRow.locked) {
    return NextResponse.json({ error: 'Window locked' }, { status: 409 })
  }

  const now = Date.now()
  const expiresAt = new Date(windowRow.window_expires_at).getTime()

  if (now > expiresAt && !windowRow.entry_started) {
    await supabase.from('entry_windows').update({ locked: true }).eq('id', windowRow.id)
    return NextResponse.json({ error: 'Window expired' }, { status: 409 })
  }

  if (!windowRow.entry_started) {
    const { error: updateError } = await supabase
      .from('entry_windows')
      .update({ entry_started: true })
      .eq('id', windowRow.id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
