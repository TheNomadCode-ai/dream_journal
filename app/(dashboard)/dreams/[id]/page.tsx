import Link from 'next/link'
import { notFound } from 'next/navigation'

import DreamShareCardDialog from '@/components/dreams/DreamShareCardDialog'
import { createClient } from '@/lib/supabase/server'

export default async function DreamDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dream } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .is('deleted_at', null)
    .single()

  if (!dream) notFound()

  const moods = ['😴', '😔', '😐', '🙂', '😄']

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="btn-ghost btn text-sm">
          ← Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {dream.lucid && <span className="badge-lucid">Lucid</span>}
            {dream.mood_score && <span>{moods[dream.mood_score - 1]}</span>}
            <span>
              {new Date(dream.date_of_dream).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
          <DreamShareCardDialog
            bodyText={dream.body_text}
            dateOfDream={dream.date_of_dream}
            moodScore={dream.mood_score}
            lucid={dream.lucid}
          />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {dream.title || 'Untitled dream'}
      </h1>

      <div className="entry-body text-foreground whitespace-pre-wrap leading-relaxed">
        {dream.body_text}
      </div>
    </div>
  )
}
