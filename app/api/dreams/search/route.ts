import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import type { ApiError, DreamSearchResponse } from '@/types/dream'

const MAX_QUERY_LENGTH = 100
const PER_PAGE_OPTIONS = [10, 20, 50] as const

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawQuery = (searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPageParam = parseInt(searchParams.get('per_page') ?? '20', 10)
  const perPage = (PER_PAGE_OPTIONS.includes(perPageParam as 10 | 20 | 50)
    ? perPageParam
    : 20) as 10 | 20 | 50
  const offset = (page - 1) * perPage

  // Empty query — return recent entries
  if (!rawQuery) {
    const { data, error, count } = await supabase
      .from('dreams')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('date_of_dream', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (error) {
      return NextResponse.json<ApiError>({ error: error.message }, { status: 500 })
    }

    return NextResponse.json<DreamSearchResponse>({
      results: (data ?? []).map((d) => ({ ...d, headline: null, rank: 0 })),
      query: '',
      total: count ?? 0,
      page,
      per_page: perPage,
    })
  }

  // Sanitise query: remove characters that break tsquery
  const sanitised = rawQuery.replace(/[&|!():*<>]/g, ' ').trim()

  // Full-text search using Postgres RPC function
  // plainto_tsquery handles natural language input gracefully
  const { data, error } = await supabase.rpc('search_dreams', {
    p_user_id: user.id,
    p_query: sanitised,
    p_limit: perPage,
    p_offset: offset,
  })

  if (error) {
    return NextResponse.json<ApiError>({ error: error.message }, { status: 500 })
  }

  const results = (data ?? []) as Array<{
    id: string
    user_id: string
    title: string | null
    body_json: Record<string, unknown>
    body_text: string | null
    mood_score: number | null
    lucid: boolean
    date_of_dream: string
    search_vec: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    headline: string | null
    rank: number
    total_count: number
  }>

  const total = results[0]?.total_count ?? 0

  return NextResponse.json<DreamSearchResponse>({
    results: results.map(({ total_count: _tc, ...r }) => r),
    query: rawQuery,
    total,
    page,
    per_page: perPage,
  })
}
