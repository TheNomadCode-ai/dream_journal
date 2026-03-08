'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import CountdownTimer from '@/components/ui/CountdownTimer'
import { dateKeyLocal, formatClock, parseTime, windowForToday } from '@/lib/dream-cycle'
import { createClient } from '@/lib/supabase/client'

type SeedRow = {
  id: string
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  morning_confirmed_at: string | null
}

type Stage = 'loading' | 'closed' | 'confirm' | 'journal' | 'saved'

function journalGuidance(text: string) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const chars = trimmed.length

  if (chars < 80) {
    return { color: '#ff9f9f', message: 'Too brief. Add setting, people, and what happened first.', words }
  }
  if (chars < 180) {
    return { color: '#f5cf8f', message: 'Good start. Add one emotion and one sensory detail.', words }
  }
  if (chars < 320) {
    return { color: '#9ee7b6', message: 'Strong detail. Keep going with sequence and symbols.', words }
  }
  return { color: '#9be2ff', message: 'Excellent depth. This is highly useful dream data.', words }
}

function MorningSkeleton() {
  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto' }}>
        <div style={{ height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[1, 2, 3].map((item) => (
            <div key={item} style={{ height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default function MorningPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const savedAtZero = useRef(false)

  const [stage, setStage] = useState<Stage>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [windowExpiresAt, setWindowExpiresAt] = useState<Date | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [yesterdaySeed, setYesterdaySeed] = useState<SeedRow | null>(null)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.replace('/login?redirectedFrom=%2Fmorning')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_wake_time')
        .eq('id', user.id)
        .maybeSingle()

      const wake = profile?.target_wake_time ?? '07:00:00'
      setWakeTime(wake)

      const wakeParts = parseTime(wake, '07:00:00')
      const windowState = windowForToday(wakeParts.hour, wakeParts.minute, 5)
      const seconds = Math.max(0, Math.ceil((windowState.expiresAt.getTime() - Date.now()) / 1000))

      console.log('[Morning] Window check:', {
        now: new Date().toISOString(),
        windowOpen: windowState.isOpen,
        secondsRemaining: seconds,
      })

      setWindowExpiresAt(windowState.expiresAt)
      setInitialSeconds(seconds)

      const yesterday = dateKeyLocal(-1)
      const { data: seed } = await supabase
        .from('dream_seeds')
        .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at')
        .eq('user_id', user.id)
        .eq('seed_date', yesterday)
        .maybeSingle()

      if (!active) return

      setYesterdaySeed(seed as SeedRow | null)

      if (!windowState.isOpen) {
        setStage('closed')
        return
      }

      if (seed && !seed.morning_confirmed_at) {
        setStage('confirm')
      } else {
        setStage('journal')
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [router, supabase])

  useEffect(() => {
    if (!userId || stage !== 'journal') return

    const key = `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
    const stored = localStorage.getItem(key)
    if (stored) {
      setBody(stored)
    }

    const autosave = window.setInterval(() => {
      localStorage.setItem(key, body)
    }, 5000)

    return () => window.clearInterval(autosave)
  }, [body, stage, userId])

  async function confirmSeed(value: boolean | null) {
    if (!yesterdaySeed) {
      setStage('journal')
      return
    }

    await supabase
      .from('dream_seeds')
      .update({
        was_dreamed: value,
        morning_confirmed_at: new Date().toISOString(),
      })
      .eq('id', yesterdaySeed.id)

    if (value && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_seeds_dreamed')
        .eq('id', userId)
        .maybeSingle()

      await supabase
        .from('profiles')
        .update({ total_seeds_dreamed: (profile?.total_seeds_dreamed ?? 0) + 1 })
        .eq('id', userId)
    }

    setYesterdaySeed({ ...yesterdaySeed, was_dreamed: value, morning_confirmed_at: new Date().toISOString() })
    setStage('journal')
  }

  async function saveJournal(fromTimeout = false) {
    if (!userId || saving || !body.trim()) {
      if (fromTimeout) setStage('saved')
      return
    }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('dreams')
      .insert({
        user_id: userId,
        title: null,
        body_text: body.trim(),
        body_json: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: body.trim() }] }],
        },
        date_of_dream: dateKeyLocal(-1),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Could not save your entry. Try again.')
      setSaving(false)
      return
    }

    if (yesterdaySeed) {
      await supabase
        .from('dream_seeds')
        .update({ dream_entry_id: data.id })
        .eq('id', yesterdaySeed.id)
    }

    if (userId) {
      const key = `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
      localStorage.removeItem(key)
    }

    setSaving(false)
    setStage('saved')
  }

  function onTimeout() {
    if (savedAtZero.current) return
    savedAtZero.current = true

    if (stage === 'journal') {
      void saveJournal(true)
      return
    }

    setStage('closed')
  }

  const guidance = journalGuidance(body)

  if (stage === 'loading') {
    return <MorningSkeleton />
  }

  if (stage === 'closed') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 12 }}>Your morning window has passed.</h1>
          <p style={{ color: '#bca7de', marginBottom: 8 }}>It opens again tomorrow at {formatClock(parseTime(wakeTime).hour, parseTime(wakeTime).minute)}.</p>
          {yesterdaySeed?.morning_confirmed_at ? (
            <p style={{ color: '#bca7de', marginBottom: 18 }}>
              Yesterday: &quot;{yesterdaySeed.seed_text}&quot; - {yesterdaySeed.was_dreamed === true ? 'appeared' : yesterdaySeed.was_dreamed === false ? "didn't appear" : 'no recall'}
            </p>
          ) : null}
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto', position: 'relative' }}>
        {windowExpiresAt ? <div style={{ position: 'absolute', right: 0, top: 0 }}><CountdownTimer totalSeconds={initialSeconds} onExpire={onTimeout} /></div> : null}

        {stage === 'confirm' && yesterdaySeed ? (
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Good morning</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 10 }}>Last night you planted:</h1>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 30, marginBottom: 16 }}>&quot;{yesterdaySeed.seed_text}&quot;</p>
            <p style={{ marginBottom: 16 }}>Did it appear in your dream?</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn-ghost-gold" style={{ minHeight: 52, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmSeed(true)}>Yes, it worked</button>
              <button className="btn-ghost-gold" style={{ minHeight: 52, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmSeed(false)}>No, it did not appear</button>
              <button className="btn-ghost-gold" style={{ minHeight: 52, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmSeed(null)}>I do not remember</button>
            </div>
          </div>
        ) : null}

        {stage === 'journal' ? (
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Capture your dream</p>
            {yesterdaySeed?.was_dreamed ? (
              <p style={{ color: '#ccb7eb', marginBottom: 8 }}>You dreamed about: {yesterdaySeed.seed_text}</p>
            ) : (
              <p style={{ color: '#ccb7eb', marginBottom: 8 }}>Write what you remember from last night. Even fragments count.</p>
            )}
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={saving}
              style={{ width: '100%', minHeight: 340, borderRadius: 12, border: '1px solid rgba(201,168,76,0.45)', background: '#0f0a1d', color: '#fff', padding: 14, marginBottom: 10 }}
              placeholder="Write everything you remember..."
            />
            <p style={{ color: '#a88fd1', marginBottom: 12 }}>{body.trim().length} chars • {guidance.words} words</p>
            {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
            <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} onClick={() => void saveJournal(false)} disabled={saving || !body.trim()}>
              {saving ? 'Saving...' : 'Save entry'}
            </button>
            <div style={{ position: 'fixed', left: 14, right: 14, bottom: 10, borderRadius: 10, border: `1px solid ${guidance.color}`, background: 'rgba(15,10,29,0.92)', padding: '10px 12px', color: guidance.color, zIndex: 40 }}>
              {guidance.message}
            </div>
          </div>
        ) : null}

        {stage === 'saved' ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 50, marginBottom: 8 }}>Saved. The window has closed.</h1>
            {yesterdaySeed ? (
              <p style={{ color: '#ccb7eb', marginBottom: 8 }}>
                {yesterdaySeed.seed_text} - {yesterdaySeed.was_dreamed === true ? 'appeared' : yesterdaySeed.was_dreamed === false ? "didn't appear" : 'no recall'}
              </p>
            ) : null}
            <Link href="/dashboard" className="btn-gold">Go to Dashboard</Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
