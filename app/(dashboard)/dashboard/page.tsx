import Link from 'next/link'
import { redirect } from 'next/navigation'

import BioClock from '@/components/dashboard/BioClock'
import MorningCheckIn from '@/components/dashboard/MorningCheckIn'
import FreeTierLimitBanner from '@/components/dashboard/FreeTierLimitBanner'
import { createClient } from '@/lib/supabase/server'
import { normalizeTier } from '@/lib/tier-config'

type DreamRow = {
  id: string
  title: string | null
  body_text: string | null
  mood_score: number | null
  lucid: boolean
  date_of_dream: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, plan, onboarding_complete, target_wake_time')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  const today = new Date().toISOString().slice(0, 10)

  const { data: todayLog } = await supabase
    .from('wake_logs')
    .select('actual_wake_time, minutes_from_target, sleep_quality')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .maybeSingle()

  const { data: wakeLogs } = await supabase
    .from('wake_logs')
    .select('log_date, minutes_from_target')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(7)

  const { count: dreamCount } = await supabase
    .from('dreams')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const { data: dreams } = await supabase
    .from('dreams')
    .select('id, title, body_text, mood_score, lucid, date_of_dream')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('date_of_dream', { ascending: false })
    .limit(30)

  const tier = normalizeTier(profile?.tier ?? profile?.plan)

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 40px 110px' }}>
      {tier === 'free' ? <FreeTierLimitBanner totalEntries={dreamCount ?? 0} /> : null}

      <MorningCheckIn
        userId={user.id}
        targetWakeTime={profile?.target_wake_time ?? '07:00:00'}
        initialTodayLog={todayLog ?? null}
      />

      <BioClock logs={wakeLogs ?? []} />

      <header style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: '#9e8bbc', marginBottom: 8 }}>
          Dream Journal
        </p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(34px,4vw,46px)', color: '#f1e9ff' }}>
          Your dream archive
        </h1>
      </header>

      {!dreams || dreams.length === 0 ? (
        <div style={{ textAlign: 'center', border: '1px solid #2a1f45', borderRadius: 14, padding: '54px 18px', background: '#100a22' }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>🌙</div>
          <p style={{ fontSize: 24, marginBottom: 6 }}>No dreams recorded yet.</p>
          <p style={{ color: '#beaada' }}>Log your morning above to write your first entry.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#2a1f45' }}>
          {dreams.map((dream: DreamRow) => (
            <Link key={dream.id} href={`/dreams/${dream.id}`} style={{ padding: '16px 14px', background: '#0f0a20' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9d8bc4', marginBottom: 8 }}>
                {formatDate(dream.date_of_dream)}
              </p>
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 26, color: '#f1e9ff', marginBottom: 6 }}>
                {dream.title || 'Untitled dream'}
              </h2>
              {dream.body_text ? (
                <p style={{ color: '#c8b8e3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {dream.body_text}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
