import { NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const form = await request.formData()

  const sellerId = String(form.get('seller_id') ?? '').trim()
  const expectedSellerId = String(process.env.GUMROAD_SELLER_ID ?? '').trim()
  const saleEmail = String(form.get('email') ?? '').trim().toLowerCase()
  const productPermalink = String(form.get('permalink') ?? '').trim()
  const refunded = form.get('refunded') === 'true'
  const cancelled = form.get('cancelled') === 'true'

  if (!expectedSellerId || sellerId !== expectedSellerId) {
    return NextResponse.json({ ok: false, error: 'invalid_seller' }, { status: 401 })
  }

  // Ignore unrelated Gumroad products.
  if (productPermalink !== 'somniavault') {
    return NextResponse.json({ ok: true })
  }

  if (!saleEmail) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient() as any
  const nextTier = refunded || cancelled ? 'free' : 'pro'

  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    return NextResponse.json({ ok: false, error: 'user_lookup_failed' }, { status: 500 })
  }

  const matchedUser = usersPage.users.find((candidate: { email?: string | null }) => candidate.email?.toLowerCase() === saleEmail)

  if (!matchedUser) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ tier: nextTier })
    .eq('id', matchedUser.id)

  if (error) {
    return NextResponse.json({ ok: false, error: 'profile_update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
