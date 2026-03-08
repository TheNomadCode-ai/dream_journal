import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { LIMITS, PRO_UPGRADE_URL, normalizeTier } from '@/lib/tier-config'
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

  return NextResponse.json<ApiError>(
    { error: 'Manual dream creation is disabled. Use the morning journal window.' },
    { status: 403 }
  )

  // Legacy path retained below for future migration reference.

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, plan')
    .eq('id', user.id)
    .maybeSingle()

  const tier = normalizeTier(profile?.tier ?? profile?.plan)

  if (tier === 'free') {
    const { count, error: countError } = await supabase
      .from('dreams')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (countError) {
      return NextResponse.json<ApiError>({ error: 'Could not validate dream entry limits.' }, { status: 500 })
    }

    if ((count ?? 0) >= LIMITS.free.maxEntries) {
      return NextResponse.json(
        {
          error: 'entry_limit_reached',
          message: 'Free accounts are limited to 30 dreams. Upgrade to Pro for unlimited entries.',
          upgradeUrl: PRO_UPGRADE_URL,
        },
        { status: 403 }
      )
    }
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
