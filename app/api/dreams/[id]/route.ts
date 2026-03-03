import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types/dream'

const updateDreamSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  body_json: z.record(z.unknown()).optional(),
  mood_score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().optional(),
  lucid: z.boolean().optional(),
  date_of_dream: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date YYYY-MM-DD')
    .refine((d) => new Date(d) <= new Date(), 'Date cannot be in the future')
    .optional(),
  tag_ids: z.array(z.string().uuid()).max(20).optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/dreams/[id]
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: dream, error } = await supabase
    .from('dreams')
    .select(`
      *,
      dream_tags (
        tags ( id, name )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !dream) {
    return NextResponse.json<ApiError>({ error: 'Dream not found' }, { status: 404 })
  }

  return NextResponse.json(dream)
}

// PATCH /api/dreams/[id]
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateDreamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { tag_ids, ...updateData } = parsed.data

  // Verify ownership before updating
  const { data: existing } = await supabase
    .from('dreams')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return NextResponse.json<ApiError>({ error: 'Dream not found' }, { status: 404 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('dreams')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json<ApiError>({ error: updateError?.message ?? 'Update failed' }, { status: 500 })
  }

  // Replace tags if provided
  if (tag_ids !== undefined) {
    await supabase.from('dream_tags').delete().eq('dream_id', id)

    if (tag_ids.length > 0) {
      const { error: tagError } = await supabase
        .from('dream_tags')
        .insert(tag_ids.map((tag_id) => ({ dream_id: id, tag_id })))

      if (tagError) {
        return NextResponse.json<ApiError>({ error: tagError.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json(updated)
}

// DELETE /api/dreams/[id] — soft delete
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('dreams')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return NextResponse.json<ApiError>({ error: 'Dream not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('dreams')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json<ApiError>({ error: deleteError.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
