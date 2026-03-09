'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import CountdownTimer from '@/components/ui/CountdownTimer'
import { useApp } from '@/context/AppContext'
import { dateKeyLocal, formatClock, getMorningWindowState, parseTime } from '@/lib/dream-cycle'
import { createClient } from '@/lib/supabase/client'

const MorningRichEditor = dynamic(() => import('@/components/morning/MorningRichEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 280, borderRadius: 12, border: '1px solid rgba(201,168,76,0.35)', background: '#0f0a1d', padding: 14, color: '#8e80a8' }}>
      Preparing your journal...
    </div>
  ),
})

type SeedRow = {
  id: string
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  morning_confirmed_at: string | null
  morning_entry_written: boolean
  dream_entry_id: string | null
}

type Stage = 'loading' | 'too-early' | 'passed' | 'time-up' | 'already-captured' | 'write' | 'reveal' | 'saved' | 'result'
type ResultState = 'yes' | 'no' | null

function MorningSkeleton() {
  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 46, marginBottom: 10 }}>Opening your morning window...</h1>
        <p style={{ color: '#bca7de' }}>Loading your schedule and today&apos;s capture status.</p>
      </section>
    </main>
  )
}

export default function MorningPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const timerExpiredRef = useRef(false)
  const timerStartedRef = useRef(false)
  const { profile: appProfile, user: appUser, loading: appLoading, setProfile: setAppProfile } = useApp()

  const [stage, setStage] = useState<Stage>('loading')
  const [result, setResult] = useState<ResultState>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [timerStarted, setTimerStarted] = useState(false)
  const [yesterdaySeed, setYesterdaySeed] = useState<SeedRow | null>(null)
  const [successRate, setSuccessRate] = useState(0)
  const [minutesUntilWindow, setMinutesUntilWindow] = useState(0)
  const [bodyText, setBodyText] = useState('')
  const [bodyJson, setBodyJson] = useState<Record<string, unknown> | null>(null)
  const [writeFadingOut, setWriteFadingOut] = useState(false)
  const [showSeedText, setShowSeedText] = useState(false)
  const [showRevealQuestion, setShowRevealQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draftKey = useMemo(() => {
    if (!userId || stage !== 'write') return null
    return `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
  }, [stage, userId])

  function handleFirstKey() {
    if (timerStartedRef.current) return

    timerStartedRef.current = true
    setTimerStarted(true)
    console.log('[Morning] Timer started')
  }

  const words = useMemo(() => {
    const trimmed = bodyText.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [bodyText])

  const canReveal = words >= 20 && !saving

  useEffect(() => {
    let active = true

    async function load() {
      if (appLoading) return

      let user = appUser
      if (!user) {
        const { data: authData } = await supabase.auth.getUser()
        user = authData.user
          ? (authData.user.email
            ? { id: authData.user.id, email: authData.user.email }
            : { id: authData.user.id })
          : null
      }

      if (!user) {
        router.replace('/login?redirectedFrom=%2Fmorning')
        return
      }

      setUserId(user.id)

      let profile = appProfile
      if (!profile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        profile = data
        if (data) setAppProfile(data)
      }

      const wake = profile?.target_wake_time ?? '07:00:00'
      setWakeTime(wake)
      const planted = profile?.total_seeds_planted ?? 0
      const dreamed = profile?.total_seeds_dreamed ?? 0
      setSuccessRate(planted > 0 ? Math.round((dreamed / planted) * 100) : 0)

      const windowState = getMorningWindowState(wake)
      const today = dateKeyLocal(0)

      console.log('[Morning] Window check:', {
        now: new Date().toISOString(),
        windowAvailable: windowState.windowAvailable,
        nowMinutes: windowState.nowMinutes,
        windowStart: windowState.windowStartMinutes,
        windowEnd: windowState.windowEndMinutes,
      })

      const yesterday = dateKeyLocal(-1)
      const [seedResult, todayDreamResult] = await Promise.all([
        supabase
          .from('dream_seeds')
          .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at, morning_entry_written, dream_entry_id')
          .eq('user_id', user.id)
          .eq('seed_date', yesterday)
          .maybeSingle(),
        supabase
          .from('dreams')
          .select('id')
          .eq('user_id', user.id)
          .eq('date_of_dream', today)
          .maybeSingle(),
      ])

      if (!active) return

      const seed = seedResult.data as SeedRow | null
      setYesterdaySeed(seed)

      const hasEntryToday = Boolean(todayDreamResult.data) || Boolean(seed?.morning_entry_written)
      const nowTotal = windowState.nowMinutes
      const windowStart = windowState.windowStartMinutes
      const windowEnd = windowState.windowEndMinutes

      if (hasEntryToday) {
        setStage('already-captured')
        return
      }

      if (nowTotal >= windowStart && nowTotal <= windowEnd) {
        setStage('write')
        return
      }

      if (nowTotal > windowEnd) {
        setStage('passed')
        return
      }

      setMinutesUntilWindow(Math.max(0, windowStart - nowTotal))
      setStage('too-early')
    }

    void load()

    return () => {
      active = false
    }
  }, [appLoading, appProfile, appUser, router, setAppProfile, supabase])

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
    if (!userId || saving || words < 20) return

    setSaving(true)
    setError(null)

    const textToSave = bodyText.trim()
    const jsonToSave = bodyJson

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
        date_of_dream: dateKeyLocal(0),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Could not save your morning entry. Try again.')
      setSaving(false)
      return
    }

    if (yesterdaySeed) {
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
    }

    if (userId) {
      const key = `somnia-morning-draft:${userId}:${dateKeyLocal(-1)}`
      localStorage.removeItem(key)
    }

    localStorage.setItem('somnia_morning_entry_date', dateKeyLocal(0))

    if (yesterdaySeed) {
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
    } else {
      setStage('saved')
    }

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

      setAppProfile((current) => {
        if (!current) return current
        return { ...current, total_seeds_dreamed: nextDreamed }
      })

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

    setStage('time-up')
  }
  if (stage === 'time-up') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 12 }}>Time is up for this capture.</h1>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>Return to your dashboard and try again in your next morning window.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }


  if (stage === 'loading') {
    return <MorningSkeleton />
  }

  if (stage === 'too-early') {
    const wakeParts = parseTime(wakeTime)
    const windowStartTotal = wakeParts.hour * 60 + wakeParts.minute - 120
    const windowStartHour = ((Math.floor(windowStartTotal / 60) % 24) + 24) % 24
    const windowStartMinute = ((windowStartTotal % 60) + 60) % 60

    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 12 }}>Too early for morning capture.</h1>
          <p style={{ color: '#bca7de', marginBottom: 8 }}>Morning window opens at {formatClock(windowStartHour, windowStartMinute)}.</p>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>Opens in {minutesUntilWindow} minute{minutesUntilWindow === 1 ? '' : 's'}.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  if (stage === 'passed') {
    const wakeParts = parseTime(wakeTime)
    const tomorrowStartTotal = wakeParts.hour * 60 + wakeParts.minute - 120
    const tomorrowStartHour = ((Math.floor(tomorrowStartTotal / 60) % 24) + 24) % 24
    const tomorrowStartMinute = ((tomorrowStartTotal % 60) + 60) % 60

    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 12 }}>Your morning window has passed.</h1>
          <p style={{ color: '#bca7de', marginBottom: 8 }}>It opens again tomorrow at {formatClock(tomorrowStartHour, tomorrowStartMinute)}.</p>
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

  if (stage === 'already-captured') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 46, marginBottom: 12 }}>Dream captured today.</h1>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>You can review it in your dashboard archive.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto', position: 'relative' }}>
        {stage === 'write' && timerStarted ? <div style={{ position: 'absolute', right: 0, top: 0 }}><CountdownTimer totalSeconds={300} onExpire={onTimeout} /></div> : null}

        {stage === 'write' ? (
          <div style={{ opacity: writeFadingOut ? 0 : 1, transition: 'opacity 600ms ease' }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Morning capture</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 50, lineHeight: 1.04, marginBottom: 14 }}>What did you dream about?</h1>
            <p style={{ color: '#bca7de', fontStyle: 'italic', marginBottom: 16 }}>
              Write everything you remember before it fades. Don&apos;t think. Just write.
            </p>

            {!timerStarted ? (
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.25)',
                  textAlign: 'right',
                  marginBottom: 10,
                }}
              >
                Timer starts when you begin writing
              </div>
            ) : null}

            <div style={{ border: '1px solid rgba(201,168,76,0.4)', borderRadius: 12, background: '#0f0a1d', padding: 14, minHeight: 320, marginBottom: 10 }}>
              <MorningRichEditor
                draftKey={draftKey}
                onFirstKey={handleFirstKey}
                onChange={(text, json) => {
                  setBodyText(text)
                  setBodyJson(json)
                }}
              />
            </div>

            {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
            {!canReveal ? <p style={{ color: '#9f8abb', marginBottom: 10 }}>Keep going - write more detail</p> : null}

            <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} onClick={() => void handleWriteComplete()} disabled={!canReveal}>
              {saving ? 'Saving...' : "I've written everything I remember"}
            </button>
          </div>
        ) : null}

        {stage === 'saved' ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 58, marginBottom: 10 }}>Dream captured today.</h1>
            <p style={{ color: '#c8bbdf', fontStyle: 'italic', marginBottom: 20 }}>
              Nice work. Keep the morning streak alive.
            </p>
            <Link href="/dashboard" className="btn-gold">Go to dashboard</Link>
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
