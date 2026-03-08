'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Italic from '@tiptap/extension-italic'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
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
  morning_entry_written: boolean
  dream_entry_id: string | null
}

type Stage = 'loading' | 'closed' | 'write' | 'reveal' | 'result'
type ResultState = 'yes' | 'no' | null

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
  const timerExpiredRef = useRef(false)

  const [stage, setStage] = useState<Stage>('loading')
  const [result, setResult] = useState<ResultState>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [windowExpiresAt, setWindowExpiresAt] = useState<Date | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [yesterdaySeed, setYesterdaySeed] = useState<SeedRow | null>(null)
  const [successRate, setSuccessRate] = useState(0)
  const [bodyText, setBodyText] = useState('')
  const [bodyJson, setBodyJson] = useState<Record<string, unknown> | null>(null)
  const [writeFadingOut, setWriteFadingOut] = useState(false)
  const [showSeedText, setShowSeedText] = useState(false)
  const [showRevealQuestion, setShowRevealQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Italic,
      History,
      Placeholder.configure({
        placeholder: 'I was somewhere...',
      }),
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        style: 'min-height: 280px; color: #f6f2ff; outline: none; line-height: 1.7; white-space: pre-wrap;',
      },
    },
    onUpdate({ editor: current }) {
      const text = current.getText().trim()
      setBodyText(text)
      setBodyJson(current.getJSON() as Record<string, unknown>)
    },
  })

  const words = useMemo(() => {
    const trimmed = bodyText.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [bodyText])

  const canReveal = words >= 20 && !saving

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
        .select('target_wake_time, total_seeds_planted, total_seeds_dreamed')
        .eq('id', user.id)
        .maybeSingle()

      const wake = profile?.target_wake_time ?? '07:00:00'
      setWakeTime(wake)
      const planted = profile?.total_seeds_planted ?? 0
      const dreamed = profile?.total_seeds_dreamed ?? 0
      setSuccessRate(planted > 0 ? Math.round((dreamed / planted) * 100) : 0)

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
        .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, morning_entry_written, dream_entry_id')
        .eq('user_id', user.id)
        .eq('seed_date', yesterday)
        .maybeSingle()

      if (!active) return

      setYesterdaySeed(seed as SeedRow | null)

      if (!windowState.isOpen) {
        setStage('closed')
        return
      }

      if (!seed) {
        setStage('closed')
        return
      }

      setStage('write')
    }

    void load()

    return () => {
      active = false
    }
  }, [router, supabase])

  useEffect(() => {
    if (!editor || !userId || stage !== 'write') return

    const key = `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { body_json?: Record<string, unknown> }
        if (parsed.body_json) {
          editor.commands.setContent(parsed.body_json)
          setBodyJson(parsed.body_json)
          setBodyText(editor.getText().trim())
        }
      } catch {
        // Ignore malformed local drafts.
      }
    }

    const autosave = window.setInterval(() => {
      const json = editor.getJSON() as Record<string, unknown>
      localStorage.setItem(key, JSON.stringify({ body_json: json }))
    }, 5000)

    return () => window.clearInterval(autosave)
  }, [editor, stage, userId])

  useEffect(() => {
    if (stage !== 'reveal') return

    setShowSeedText(false)
    setShowRevealQuestion(false)

    const seedTimer = window.setTimeout(() => setShowSeedText(true), 800)
    const questionTimer = window.setTimeout(() => setShowRevealQuestion(true), 1800)

    return () => {
      window.clearTimeout(seedTimer)
      window.clearTimeout(questionTimer)
    }
  }, [stage])

  async function handleWriteComplete() {
    if (!userId || !yesterdaySeed || !editor || saving || words < 20) return

    setSaving(true)
    setError(null)

    const textToSave = editor.getText().trim()
    const jsonToSave = (editor.getJSON() as Record<string, unknown>) ?? bodyJson

    const { data, error: insertError } = await supabase
      .from('dreams')
      .insert({
        user_id: userId,
        title: null,
        body_text: textToSave,
        body_json: jsonToSave ?? {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: textToSave }] }],
        },
        date_of_dream: dateKeyLocal(-1),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Could not save your morning entry. Try again.')
      setSaving(false)
      return
    }

    const { error: seedUpdateError } = await supabase
      .from('dream_seeds')
      .update({
        dream_entry_id: data.id,
        morning_entry_written: true,
      })
      .eq('id', yesterdaySeed.id)

    if (seedUpdateError) {
      setError('Entry was saved, but seed reveal could not be unlocked. Try again.')
      setSaving(false)
      return
    }

    if (userId) {
      const key = `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
      localStorage.removeItem(key)
    }

    setYesterdaySeed({
      ...yesterdaySeed,
      dream_entry_id: data.id,
      morning_entry_written: true,
    })

    setWriteFadingOut(true)
    window.setTimeout(() => {
      setStage('reveal')
      setWriteFadingOut(false)
    }, 600)

    setSaving(false)
  }

  async function confirmSeedAppeared(value: boolean) {
    if (!yesterdaySeed || !userId || confirming) return

    setConfirming(true)
    const confirmedAt = new Date().toISOString()

    await supabase
      .from('dream_seeds')
      .update({
        was_dreamed: value,
        morning_confirmed_at: confirmedAt,
      })
      .eq('id', yesterdaySeed.id)

    let nextSuccessRate = successRate
    if (value) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_seeds_dreamed, total_seeds_planted')
        .eq('id', userId)
        .maybeSingle()

      const nextDreamed = (profile?.total_seeds_dreamed ?? 0) + 1
      const planted = profile?.total_seeds_planted ?? 0

      await supabase
        .from('profiles')
        .update({ total_seeds_dreamed: nextDreamed })
        .eq('id', userId)

      nextSuccessRate = planted > 0 ? Math.round((nextDreamed / planted) * 100) : 0
    }

    setSuccessRate(nextSuccessRate)
    setYesterdaySeed({ ...yesterdaySeed, was_dreamed: value, morning_confirmed_at: confirmedAt })
    setResult(value ? 'yes' : 'no')
    setStage('result')
    setConfirming(false)
  }

  function onTimeout() {
    if (timerExpiredRef.current) return
    timerExpiredRef.current = true

    setStage('closed')
  }

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
              Yesterday: {yesterdaySeed.was_dreamed === true ? 'appeared' : 'did not appear'}
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

        {stage === 'write' ? (
          <div style={{ opacity: writeFadingOut ? 0 : 1, transition: 'opacity 600ms ease' }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Morning capture</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 50, lineHeight: 1.04, marginBottom: 14 }}>What did you dream about?</h1>
            <p style={{ color: '#bca7de', fontStyle: 'italic', marginBottom: 16 }}>
              Write everything you remember before it fades. Don&apos;t think. Just write.
            </p>

            <div style={{ border: '1px solid rgba(201,168,76,0.4)', borderRadius: 12, background: '#0f0a1d', padding: 14, minHeight: 320, marginBottom: 10 }}>
              <EditorContent editor={editor} />
            </div>

            {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
            {!canReveal ? <p style={{ color: '#9f8abb', marginBottom: 10 }}>Keep going - write more detail</p> : null}

            <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} onClick={() => void handleWriteComplete()} disabled={!canReveal}>
              {saving ? 'Saving...' : "I've written everything I remember"}
            </button>
          </div>
        ) : null}

        {stage === 'reveal' && yesterdaySeed ? (
          <div style={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center', textAlign: 'center', opacity: 1, transition: 'opacity 600ms ease' }}>
            <div style={{ width: '100%' }}>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 18 }}>Last night&apos;s seed</p>
              <p
                style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 44,
                  color: 'rgba(200,160,80,0.90)',
                  maxWidth: 320,
                  margin: '0 auto 18px',
                  opacity: showSeedText ? 1 : 0,
                  transition: 'opacity 600ms ease',
                }}
              >
                &quot;{yesterdaySeed.seed_text}&quot;
              </p>

              <div style={{ opacity: showRevealQuestion ? 1 : 0, transition: 'opacity 600ms ease' }}>
                <p style={{ color: '#a99abc', marginBottom: 16 }}>Did this appear in your dream?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 520, margin: '0 auto' }}>
                  <button
                    className="btn-gold"
                    style={{ minHeight: 56, justifyContent: 'center' }}
                    disabled={confirming}
                    onClick={() => void confirmSeedAppeared(true)}
                  >
                    Yes, it appeared
                  </button>
                  <button
                    className="btn-ghost-gold"
                    style={{ minHeight: 56, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'center', padding: '0 12px', color: '#d6caeb' }}
                    disabled={confirming}
                    onClick={() => void confirmSeedAppeared(false)}
                  >
                    Not that I recall
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {stage === 'result' && result === 'yes' ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 58, marginBottom: 10 }}>It worked.</h1>
            <p style={{ color: '#c8bbdf', fontStyle: 'italic', marginBottom: 12 }}>
              Your subconscious processed the intention you planted.
            </p>
            <p style={{ color: 'rgba(200,160,80,0.90)', marginBottom: 20 }}>Your success rate: {successRate}%</p>
            <Link href="/dashboard" className="btn-gold">Go to dashboard</Link>
          </div>
        ) : null}

        {stage === 'result' && result === 'no' ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 58, marginBottom: 10 }}>Not this time.</h1>
            <p style={{ color: '#c8bbdf', fontStyle: 'italic', marginBottom: 12 }}>
              Dream incubation takes practice. Most people see results within 7 to 14 nights of consistent planting. Keep going.
            </p>
            <p style={{ color: '#a99abc', marginBottom: 20 }}>Your seed is saved in your archive.</p>
            <Link href="/dashboard" className="btn-gold">Go to dashboard</Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
