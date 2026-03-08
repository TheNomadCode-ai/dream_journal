import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types/dream'

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
  void request

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json<ApiError>(
    { error: 'Manual dream creation is disabled. Use the morning journal window.' },
    { status: 403 }
  )
}
