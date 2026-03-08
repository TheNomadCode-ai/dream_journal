import { NextResponse } from 'next/server'

import { createNotebookSchema } from '@/lib/validations/notebooks'
import { createClient } from '@/lib/supabase/server'
import { LIMITS, PRO_UPGRADE_URL, normalizeTier } from '@/lib/tier-config'
import type { Notebook, NotebookErrorResponse, NotebookListResponse } from '@/types/notebook'

type NotebookRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_color: string | null
  created_at: string
  updated_at: string
}

export async function GET() {
  const supabase = (await createClient()) as any

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle()

  const tier = normalizeTier(profile?.tier)

  const { data: notebooks, error } = await supabase
    .from('notebooks')
    .select('id, user_id, name, description, cover_color, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Could not load notebooks.' }, { status: 500 })
  }

  const rows = (notebooks ?? []) as NotebookRow[]

  const notebookIds = rows.map((row) => row.id)
  const countByNotebook = new Map<string, number>()

  if (notebookIds.length > 0) {
    const { data: links } = await supabase
      .from('dream_notebooks')
      .select('notebook_id')
      .in('notebook_id', notebookIds)

    ;((links ?? []) as unknown as Array<{ notebook_id: string }>).forEach((link) => {
      const notebookId = link.notebook_id
      countByNotebook.set(notebookId, (countByNotebook.get(notebookId) ?? 0) + 1)
    })
  }

  const payload: NotebookListResponse = {
    tier,
    notebooks: rows.map((row) => ({
      ...row,
      cover_color: (row.cover_color ?? '4F46E5').toUpperCase(),
      dream_count: countByNotebook.get(row.id) ?? 0,
    })),
  }

  return NextResponse.json(payload)
}

export async function POST(request: Request) {
  const supabase = (await createClient()) as any

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle()

  const tier = normalizeTier(profile?.tier)

  if (tier === 'free') {
    const { count, error: countError } = await supabase
      .from('notebooks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Could not validate notebook limits.' }, { status: 500 })
    }

    if ((count ?? 0) >= LIMITS.free.maxNotebooks) {
      return NextResponse.json<NotebookErrorResponse>(
        {
          error: 'notebook_limit_reached',
          message: 'Free accounts can create one notebook. Upgrade to Pro for unlimited notebooks.',
          upgradeUrl: PRO_UPGRADE_URL,
        },
        { status: 403 }
      )
    }
  }

  try {
    const body = await request.json()
    const parsed = createNotebookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Please enter a valid notebook name and color.' }, { status: 400 })
    }

    const { name, description, cover_color } = parsed.data

    const { data: notebook, error } = await supabase
      .from('notebooks')
      .insert({
        user_id: user.id,
        name,
        description: description?.trim() || null,
        cover_color: (cover_color ?? '4F46E5').toUpperCase(),
      } as never)
      .select('id, user_id, name, description, cover_color, created_at, updated_at')
      .single()

    if (error || !notebook) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Could not create notebook.' }, { status: 500 })
    }

    const notebookRow = notebook as unknown as NotebookRow

    const payload: Notebook = {
      ...notebookRow,
      cover_color: (notebookRow.cover_color ?? '4F46E5').toUpperCase(),
      dream_count: 0,
    }

    return NextResponse.json(payload, { status: 201 })
  } catch {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }
}
