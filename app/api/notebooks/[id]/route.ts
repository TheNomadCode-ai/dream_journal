import { NextResponse } from 'next/server'

import { updateNotebookSchema } from '@/lib/validations/notebooks'
import { createClient } from '@/lib/supabase/server'
import type { NotebookDetailResponse, NotebookErrorResponse } from '@/types/notebook'

type Params = { params: Promise<{ id: string }> }

type NotebookRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_color: string | null
  created_at: string
  updated_at: string
}

type DreamRow = {
  id: string
  title: string | null
  body_text: string | null
  mood_score: number | null
  lucid: boolean
  date_of_dream: string
  created_at: string
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notebook, error } = await supabase
    .from('notebooks')
    .select('id, user_id, name, description, cover_color, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Could not load notebook.' }, { status: 500 })
  }

  if (!notebook) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Notebook not found.' }, { status: 404 })
  }

  const { data: links } = await supabase
    .from('dream_notebooks')
    .select('dream_id')
    .eq('notebook_id', id)

  const dreamIds = ((links ?? []) as unknown as Array<{ dream_id: string }>).map((row) => row.dream_id)

  let dreams: DreamRow[] = []
  if (dreamIds.length > 0) {
    const { data: dreamRows, error: dreamError } = await supabase
      .from('dreams')
      .select('id, title, body_text, mood_score, lucid, date_of_dream, created_at')
      .eq('user_id', user.id)
      .in('id', dreamIds)
      .is('deleted_at', null)
      .order('date_of_dream', { ascending: false })

    if (dreamError) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Could not load notebook dreams.' }, { status: 500 })
    }

    dreams = (dreamRows ?? []) as DreamRow[]
  }

  const payload: NotebookDetailResponse = {
    notebook: {
      ...(notebook as NotebookRow),
      cover_color: ((notebook as NotebookRow).cover_color ?? '4F46E5').toUpperCase(),
      dream_count: dreams.length,
    },
    dreams,
  }

  return NextResponse.json(payload)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = updateNotebookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Please provide valid notebook updates.' }, { status: 400 })
    }

    const updates = parsed.data

    const { data: notebook, error } = await supabase
      .from('notebooks')
      .update({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.description !== undefined ? { description: updates.description?.trim() || null } : {}),
        ...(updates.cover_color !== undefined ? { cover_color: updates.cover_color.toUpperCase() } : {}),
      } as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, description, cover_color, created_at, updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Could not update notebook.' }, { status: 500 })
    }

    if (!notebook) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Notebook not found.' }, { status: 404 })
    }

    return NextResponse.json({
      ...(notebook as NotebookRow),
      cover_color: ((notebook as NotebookRow).cover_color ?? '4F46E5').toUpperCase(),
    })
  } catch {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('notebooks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Notebook not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('notebooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Could not delete notebook.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
