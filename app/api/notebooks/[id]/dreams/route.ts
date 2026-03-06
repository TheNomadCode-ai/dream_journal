import { NextResponse } from 'next/server'

import { notebookDreamLinkSchema } from '@/lib/validations/notebooks'
import { createClient } from '@/lib/supabase/server'
import type { NotebookErrorResponse } from '@/types/notebook'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = notebookDreamLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Please choose a valid dream.' }, { status: 400 })
    }

    const { dream_id } = parsed.data

    const { data: notebook } = await supabase
      .from('notebooks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!notebook) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Notebook not found.' }, { status: 404 })
    }

    const { data: dream } = await supabase
      .from('dreams')
      .select('id')
      .eq('id', dream_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!dream) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Dream not found.' }, { status: 404 })
    }

    const { error } = await supabase
      .from('dream_notebooks')
      .upsert({ dream_id, notebook_id: id } as never, { onConflict: 'dream_id,notebook_id', ignoreDuplicates: true })

    if (error) {
      return NextResponse.json<NotebookErrorResponse>({ error: 'Could not add dream to notebook.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }
}
