import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import type { NotebookErrorResponse } from '@/types/notebook'

type Params = { params: Promise<{ id: string; dreamId: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id, dreamId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notebook } = await supabase
    .from('notebooks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!notebook) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Notebook not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('dream_notebooks')
    .delete()
    .eq('notebook_id', id)
    .eq('dream_id', dreamId)

  if (error) {
    return NextResponse.json<NotebookErrorResponse>({ error: 'Could not remove dream from notebook.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
