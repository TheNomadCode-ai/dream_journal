import { NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const getField = (key: string) => (form as any).get(key)

  const sellerId = String(getField('seller_id') ?? '').trim()
  const expectedSellerId = String(process.env.GUMROAD_SELLER_ID ?? '').trim()
  const saleEmail = String(getField('email') ?? '').trim().toLowerCase()
  const productPermalink = String(getField('permalink') ?? '').trim()
  const refunded = getField('refunded') === 'true'
  const cancelled = getField('cancelled') === 'true'

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
