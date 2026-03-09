import { redirect } from 'next/navigation'

import JournalWindowClient from '@/components/journal/JournalWindowClient'
import { createClient } from '@/lib/supabase/server'

export default async function JournalNewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectedFrom=%2Fjournal%2Fnew')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_wake_time')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="page-enter">
      <JournalWindowClient
        userId={user.id}
        targetWakeTime={profile?.target_wake_time ?? '07:00:00'}
      />
    </div>
  )
}
