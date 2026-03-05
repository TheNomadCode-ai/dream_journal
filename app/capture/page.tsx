import { redirect } from 'next/navigation'

import CapturePageClient from '@/components/capture/CapturePageClient'
import { createClient } from '@/lib/supabase/server'

type CapturePageProps = {
  searchParams: Promise<{ window_id?: string }>
}

export default async function CapturePage({ searchParams }: CapturePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const windowId = params.window_id

  if (!user) {
    const target = windowId ? `/capture?window_id=${windowId}` : '/capture'
    redirect(`/login?redirectedFrom=${encodeURIComponent(target)}`)
  }

  return <CapturePageClient initialWindowId={windowId ?? null} />
}
