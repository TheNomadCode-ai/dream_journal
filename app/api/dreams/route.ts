import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import type { ApiError, CreateDreamInput } from '@/types/dream'

const createDreamSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  body_json: z.record(z.unknown()),
  mood_score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().optional(),
  lucid: z.boolean().optional().default(false),
  date_of_dream: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date YYYY-MM-DD')
    .refine((d) => new Date(d) <= new Date(), 'Date cannot be in the future'),
  tag_ids: z.array(z.string().uuid()).max(20).optional().default([]),
})

// GET /api/dreams — list dreams (paginated, soft-delete filtered)
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = 20
  const offset = (page - 1) * perPage

  const { data: dreams, error, count } = await supabase
    .from('dreams')
    .select(`
      *,
      dream_tags (
        tags ( id, name )
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('date_of_dream', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    return NextResponse.json<ApiError>({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0

  return NextResponse.json({
    dreams: dreams ?? [],
    total,
    page,
    per_page: perPage,
    has_more: offset + perPage < total,
  })
}

// POST /api/dreams — create new dream entry
export async function POST(request: Request) {
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

  const parsed = createDreamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const input: CreateDreamInput = parsed.data
  const { tag_ids, ...dreamData } = input

  // Insert dream
  const { data: dream, error: insertError } = await supabase
    .from('dreams')
    .insert({ ...dreamData, user_id: user.id })
    .select()
    .single()

  if (insertError || !dream) {
    return NextResponse.json<ApiError>({ error: insertError?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Associate tags
  if (tag_ids && tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from('dream_tags')
      .insert(tag_ids.map((tag_id) => ({ dream_id: dream.id, tag_id })))

    if (tagError) {
      return NextResponse.json<ApiError>({ error: tagError.message }, { status: 500 })
    }
  }

  return NextResponse.json(dream, { status: 201 })
}
