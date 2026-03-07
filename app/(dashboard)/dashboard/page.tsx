import Link from 'next/link'
import { redirect } from 'next/navigation'

import FreeTierLimitBanner from '@/components/dashboard/FreeTierLimitBanner'
import { createClient } from '@/lib/supabase/server'
import { normalizeTier } from '@/lib/tier-config'

interface DreamRow {
  id: string
  title: string | null
  body_text: string | null
  mood_score: number | null
  lucid: boolean
  date_of_dream: string
  created_at: string
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Restless',
  2: 'Melancholy',
  3: 'Neutral',
  4: 'Peaceful',
  5: 'Luminous',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type DashboardPageProps = {
  searchParams: Promise<{ banner?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const { data: profile } = userId
    ? await supabase
        .from('user_profiles')
        .select('current_streak, auto_pattern_insight, tier, plan, onboarding_complete')
        .eq('id', userId)
        .single()
    : { data: null }

  if (userId && !profile?.onboarding_complete) {
    const { data: alarms, error: alarmsError } = await supabase
      .from('alarms')
      .select('id, enabled')
      .eq('user_id', userId)
      .limit(1)

    // Do not redirect on query errors; only redirect when no alarm exists at all.
    if (!alarmsError && (!alarms || alarms.length === 0)) {
      redirect('/onboarding')
    }
  }

  const { count: dreamCount } = userId
    ? await supabase
        .from('dreams')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null)
    : { count: 0 }

  const { data } = await supabase
    .from('dreams')
    .select('id, title, body_text, mood_score, lucid, date_of_dream, created_at')
    .is('deleted_at', null)
    .order('date_of_dream', { ascending: false })
    .limit(30)

  const dreams = (data ?? []) as DreamRow[]
  const currentStreak = profile?.current_streak ?? 0
  const tier = normalizeTier(profile?.tier ?? profile?.plan)
  const isFreeTier = tier === 'free'
  const autoPatternInsight = profile?.auto_pattern_insight
  const showInsightCard = (dreamCount ?? 0) >= 5 && !!autoPatternInsight
  const showCaptureBanner = params.banner === 'set-alarm'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 120px' }}>
      {isFreeTier ? <FreeTierLimitBanner totalEntries={dreamCount ?? 0} /> : null}


      <section
        style={{
          border: '1px solid #1E2235',
          background: '#12141F',
          padding: '20px 24px',
          marginBottom: '34px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="#C9A84C"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '20px',
            color: '#E8E4D9',
            letterSpacing: '-0.01em',
          }}
        >
          {currentStreak} mornings captured
        </p>
      </section>

      {showInsightCard && (
        <section
          style={{
            border: '1px solid #1E2235',
            background: '#12141F',
            padding: '24px',
            marginBottom: '40px',
          }}
        >
          <p
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontSize: '10px',
              fontWeight: 300,
              color: '#C9A84C',
              marginBottom: '10px',
            }}
          >
            Pattern insight
          </p>
          <p
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: '19px',
              lineHeight: 1.7,
              color: '#E8E4D9',
              letterSpacing: '-0.01em',
            }}
          >
            {autoPatternInsight}
          </p>
        </section>
      )}

      {showCaptureBanner && (
        <section
          style={{
            border: '1px solid rgba(201,168,76,0.34)',
            background: 'rgba(201,168,76,0.08)',
            padding: '16px 18px',
            marginBottom: '26px',
          }}
        >
          <p style={{ color: '#E8E4D9', fontSize: '15px', lineHeight: 1.5 }}>
            Set a wake-up alarm to unlock timed capture.{' '}
            <Link href="/settings/alarm" className="btn-ghost-gold" style={{ fontSize: '10px', marginLeft: '8px' }}>
              Configure alarm →
            </Link>
          </p>
        </section>
      )}

      {/* ── Page header ──────────────────────────────────────── */}
      <header style={{ marginBottom: '56px' }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
            marginBottom: '14px',
          }}
        >
          Dream Journal
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(36px, 4vw, 48px)',
            color: '#E8E4D9',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {dreams && dreams.length > 0 ? 'Your nights, recorded.' : 'The night is waiting.'}
        </h1>
        <div style={{ width: '40px', height: '1px', background: '#C9A84C', opacity: 0.6, marginTop: '16px' }} />
      </header>

      {/* ── Dream feed ───────────────────────────────────────── */}
      {!dreams || dreams.length === 0 ? (

        /* Empty state */
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: '0 auto 28px', opacity: 0.2 }}
          >
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="#C9A84C"
              strokeWidth="1"
            />
          </svg>
          <p
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '24px',
              color: '#6B6F85',
              lineHeight: 1.5,
              marginBottom: '36px',
              letterSpacing: '-0.01em',
            }}
          >
            No dreams recorded yet.<br />The night is waiting.
          </p>
          <Link href="/capture" className="btn-gold">
            Begin your first entry
          </Link>
        </div>

      ) : (

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1E2235' }}>
          {dreams.map((dream) => (
            <Link key={dream.id} href={`/dreams/${dream.id}`} className="dream-card">

              {/* Date + badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    fontSize: '10px',
                    fontWeight: 300,
                    color: '#6B6F85',
                  }}
                >
                  {formatDate(dream.date_of_dream)}
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {dream.lucid && <span className="gold-pill">Lucid</span>}
                  {dream.mood_score && (
                    <span className="mood-pill">
                      {MOOD_LABELS[dream.mood_score] ?? `Mood ${dream.mood_score}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '22px',
                  color: '#E8E4D9',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                  marginBottom: dream.body_text ? '10px' : 0,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {dream.title || 'Untitled dream'}
              </h2>

              {/* Excerpt */}
              {dream.body_text && (
                <p
                  style={{
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    fontSize: '15px',
                    color: '#6B6F85',
                    lineHeight: 1.6,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {dream.body_text}
                </p>
              )}
            </Link>
          ))}
        </div>

      )}

      {/* ── Floating new-entry button ─────────────────────────── */}
      <Link href="/capture" className="float-btn" aria-label="Start timed capture">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  )
}
