/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { textFromBodyJson } from '@/lib/alarm-capture'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

const saveSchema = z.object({
  window_id: z.string().uuid(),
  title: z.string().max(200).optional().nullable(),
  body_json: z.record(z.unknown()),
})

export async function POST(request: Request) {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const parsed = saveSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { window_id, title, body_json } = parsed.data

  const { data: windowRow, error } = await supabase
    .from('entry_windows')
    .select('id, user_id, window_date, entry_started, entry_id, locked')
    .eq('id', window_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!windowRow) {
    return NextResponse.json({ error: 'Window not found' }, { status: 404 })
  }

  if (windowRow.locked) {
    return NextResponse.json({ error: 'Window locked' }, { status: 409 })
  }

  if (!windowRow.entry_started) {
    return NextResponse.json({ error: 'Entry has not been started' }, { status: 409 })
  }

  if (windowRow.entry_id) {
    return NextResponse.json({ dreamId: windowRow.entry_id, alreadySaved: true })
  }

  const { data: dream, error: dreamError } = await supabase
    .from('dreams')
    .insert({
      user_id: user.id,
      title: title?.trim() || null,
      body_json,
      body_text: textFromBodyJson(body_json as Json),
      date_of_dream: windowRow.window_date,
    })
    .select('id')
    .single()

  if (dreamError || !dream) {
    return NextResponse.json({ error: dreamError?.message ?? 'Could not save dream' }, { status: 500 })
  }

  const { error: linkError } = await supabase
    .from('entry_windows')
    .update({ entry_id: dream.id })
    .eq('id', windowRow.id)
    .eq('user_id', user.id)

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  return NextResponse.json({ dreamId: dream.id })
}
