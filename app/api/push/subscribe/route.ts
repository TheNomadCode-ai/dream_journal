import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  console.log('Subscribe route hit')

  try {
    // Server-side session-aware client used for identifying the current user.
    const serverClient = await createServerClient()

    // Service-role client used for writes so RLS cannot block subscription persistence.
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser()

    console.log('User:', user?.id)
    console.log('Auth error:', authError)

    if (!user) {
      console.log('No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await req.json()
    console.log('Subscription received:', JSON.stringify(subscription).slice(0, 100))

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          subscription,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

    console.log('Upsert data:', data)
    console.log('Upsert error:', error)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    console.log('Saved successfully:', data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  const serverClient = await createServerClient()
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const {
    data: { user },
  } = await serverClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
