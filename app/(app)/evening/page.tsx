'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import CountdownTimer from '@/components/ui/CountdownTimer'
import { addMinutes, dateKeyLocal, formatClock, minusMinutes, parseTime, windowForToday } from '@/lib/dream-cycle'
import { createClient } from '@/lib/supabase/client'

type SeedRow = {
  id: string
  seed_text: string
  seed_date: string
  was_dreamed: boolean | null
  morning_confirmed_at: string | null
}

const SUGGESTIONS_40 = [
  'A place where you felt completely safe',
  'Someone you miss',
  "A problem you're trying to solve",
  'Your earliest childhood memory',
  'A version of yourself you want to become',
  "A door you've never opened",
  "Something you're afraid to want",
  'A conversation you never had',
  'A hidden room in your home',
  'Meeting your future self',
  'A river that speaks',
  'A forgotten friend returning',
  'Flying over your hometown',
  'An unresolved conflict made peaceful',
  'A mountain at sunrise',
  'Receiving guidance from a wise elder',
  'A city made of glass',
  'A letter arriving with your name',
  'An animal guide appearing',
  'A dream inside a dream',
  'A safe reunion with someone lost',
  'A new creative idea taking shape',
  'Walking through a familiar place transformed',
  'Finding a key that unlocks truth',
  'A healing conversation',
  'A star map with your path',
  'A childhood room revisited',
  'Dancing without fear',
  'A calm ocean at night',
  'A bridge to a new chapter',
  'A mirror showing your strengths',
  'Meeting the part of you that is brave',
  'A garden that grows overnight',
  'A temple filled with light',
  'A mystery finally understood',
  'A symbol that repeats with meaning',
  'A train to an unknown destination',
  'A moonlit path through trees',
  'A moment of deep forgiveness',
  'A room full of future possibilities',
]

type Stage = 'loading' | 'closed' | 'confirm' | 'journal-prompt' | 'plant' | 'planted' | 'upgrade'

function shuffle<T>(values: T[]): T[] {
  const clone = [...values]
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = clone[i]
    clone[i] = clone[j]
    clone[j] = temp
  }
  return clone
}

function seedGuidance(text: string) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const chars = trimmed.length

  if (chars < 20) {
    return { tone: 'low', color: '#ff9f9f', message: 'Too vague. Add sensory detail, emotion, or a person/place.', words }
  }
  if (chars < 50) {
    return { tone: 'building', color: '#f5cf8f', message: 'Good start. Try adding one concrete image or feeling.', words }
  }
  if (chars < 120) {
    return { tone: 'good', color: '#9ee7b6', message: 'Great clarity. This is descriptive enough for incubation.', words }
  }
  return { tone: 'strong', color: '#9be2ff', message: 'Excellent depth. Keep this focused intention for sleep.', words }
}

export default function EveningPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [sleepTime, setSleepTime] = useState('23:00:00')
  const [windowOpenedAt, setWindowOpenedAt] = useState<Date | null>(null)
  const [windowExpiresAt, setWindowExpiresAt] = useState<Date | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [yesterdaySeed, setYesterdaySeed] = useState<SeedRow | null>(null)
  const [seedText, setSeedText] = useState('')
  const [shownSuggestions, setShownSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSeedAccess, setHasSeedAccess] = useState(false)
  const [trialEnded, setTrialEnded] = useState(false)

  useEffect(() => {
    setShownSuggestions(shuffle(SUGGESTIONS_40).slice(0, 6))
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.replace('/login?redirectedFrom=%2Fevening')
        return
      }

      if (!active) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_sleep_time, target_wake_time, tier, trial_ends_at')
        .eq('id', user.id)
        .maybeSingle()

      const wake = profile?.target_wake_time ?? '07:00:00'
      const sleep = profile?.target_sleep_time ?? '23:00:00'
      setWakeTime(wake)
      setSleepTime(sleep)

      const tier = profile?.tier ?? 'free'
      const trialActive = Boolean(profile?.trial_ends_at) && new Date(profile?.trial_ends_at ?? '').getTime() > Date.now()
      const trialHasEnded = tier === 'free' && Boolean(profile?.trial_ends_at) && !trialActive
      const canPlantSeeds = tier === 'pro' || trialActive
      setHasSeedAccess(canPlantSeeds)
      setTrialEnded(trialHasEnded)

      const sleepParts = parseTime(sleep, '23:00:00')
      const notif = minusMinutes(sleepParts.hour, sleepParts.minute, 30)
      const windowState = windowForToday(notif.hour, notif.minute, 5)
      const seconds = Math.max(0, Math.ceil((windowState.expiresAt.getTime() - Date.now()) / 1000))

      console.log('[Evening] Window check:', {
        now: new Date().toISOString(),
        windowOpen: windowState.isOpen,
        secondsRemaining: seconds,
      })

      setWindowOpenedAt(windowState.openedAt)
      setWindowExpiresAt(windowState.expiresAt)
      setInitialSeconds(seconds)

      if (!canPlantSeeds) {
        setStage('upgrade')
        return
      }

      if (!windowState.isOpen) {
        setStage('closed')
        return
      }

      const yesterday = dateKeyLocal(-1)
      const { data: priorSeed } = await supabase
        .from('dream_seeds')
        .select('id, seed_text, seed_date, was_dreamed, morning_confirmed_at')
        .eq('user_id', user.id)
        .eq('seed_date', yesterday)
        .maybeSingle()

      if (!active) return

      setYesterdaySeed(priorSeed as SeedRow | null)

      const draftKey = `somnia-evening-draft:${user.id}:${dateKeyLocal(0)}`
      const storedDraft = localStorage.getItem(draftKey)
      if (storedDraft) {
        setSeedText(storedDraft)
      }

      if (priorSeed && !priorSeed.morning_confirmed_at) {
        setStage('confirm')
        return
      }

      setStage('plant')
    }

    void load()

    return () => {
      active = false
    }
  }, [router, supabase])

  useEffect(() => {
    if (!userId || stage !== 'plant') return
    const draftKey = `somnia-evening-draft:${userId}:${dateKeyLocal(0)}`
    const autosave = window.setInterval(() => {
      localStorage.setItem(draftKey, seedText)
    }, 5000)

    return () => window.clearInterval(autosave)
  }, [seedText, stage, userId])

  function onTimeout() {
    if (userId) {
      const draftKey = `somnia-evening-draft:${userId}:${dateKeyLocal(0)}`
      localStorage.setItem(draftKey, seedText)
    }
    if (stage !== 'planted') {
      setStage('closed')
    }
  }

  async function confirmYesterday(value: boolean | null) {
    if (!yesterdaySeed) {
      setStage('plant')
      return
    }

    await supabase
      .from('dream_seeds')
      .update({
        was_dreamed: value,
        morning_confirmed_at: new Date().toISOString(),
      })
      .eq('id', yesterdaySeed.id)

    setYesterdaySeed({ ...yesterdaySeed, was_dreamed: value, morning_confirmed_at: new Date().toISOString() })
    setStage('journal-prompt')
  }

  async function plantSeed() {
    if (!userId || !windowOpenedAt || !seedText.trim()) return
    if (saving) return

    setSaving(true)
    setError(null)

    const today = dateKeyLocal(0)
    const expiresAt = addMinutes(windowOpenedAt, 5)

    const { error: seedError } = await supabase
      .from('dream_seeds')
      .upsert({
        user_id: userId,
        seed_text: seedText.trim(),
        seed_date: today,
        evening_window_opened_at: windowOpenedAt.toISOString(),
        evening_window_expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id,seed_date' })

    if (seedError) {
      setError('Could not plant seed. Try again.')
      setSaving(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_seeds_planted')
      .eq('id', userId)
      .maybeSingle()

    await supabase
      .from('profiles')
      .update({
        last_seed_date: today,
        total_seeds_planted: (profile?.total_seeds_planted ?? 0) + 1,
      })
      .eq('id', userId)

    const draftKey = `somnia-evening-draft:${userId}:${dateKeyLocal(0)}`
    localStorage.removeItem(draftKey)

    console.log('[Evening] Seed planted:', seedText.trim())

    setSaving(false)
    setStage('planted')
  }

  const guidance = seedGuidance(seedText)
  const sleepParts = parseTime(sleepTime, '23:00:00')
  const eveningParts = minusMinutes(sleepParts.hour, sleepParts.minute, 30)

  if (stage === 'loading') {
    return <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center' }}>Loading...</main>
  }

  if (stage === 'closed') {
    return (
      <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 50, marginBottom: 12 }}>The planting window has closed.</h1>
          <p style={{ color: '#bca7de', marginBottom: 8 }}>Tonight's window was at {formatClock(eveningParts.hour, eveningParts.minute)}.</p>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>It opens again tomorrow at {formatClock(eveningParts.hour, eveningParts.minute)}.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  if (stage === 'upgrade') {
    return (
      <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 24, display: 'grid', placeItems: 'center' }}>
        <section style={{ width: 'min(760px, 100%)' }}>
          <p style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a995ca', fontSize: 11, marginBottom: 10 }}>
            {trialEnded ? 'Your trial has ended' : 'Pro feature'}
          </p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(40px,6vw,54px)', marginBottom: 12 }}>
            Continue planting
            <br />
            dream seeds.
          </h1>
          <p style={{ color: '#c6b4e3', lineHeight: 1.7, marginBottom: 18 }}>
            You used Somnia Pro free for 7 days. Upgrade to keep planting seeds every evening and tracking what your subconscious does with them.
          </p>

          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, background: '#100a22', padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9f8abb', fontSize: 11, marginBottom: 8 }}>FREE</p>
                <p>Dream journal</p>
                <p>Morning window</p>
                <p>Archive</p>
                <p>Streak</p>
              </div>
              <div>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9f8abb', fontSize: 11, marginBottom: 8 }}>PRO</p>
                <p>Everything in Free</p>
                <p>+ Seed planting</p>
                <p>+ Seed insights</p>
                <p>+ AI suggestions</p>
                <p>+ Weekly digest</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <a href="https://sushankhanal.gumroad.com/l/somniavault?wanted=true" target="_blank" rel="noreferrer" className="btn-gold" style={{ justifyContent: 'center' }}>
              {'Upgrade to Pro - $4.99/mo ->'}
            </a>
            <button className="btn-ghost-gold" onClick={() => router.push('/dashboard')}>{'Continue with free ->'}</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto', position: 'relative' }}>
        {hasSeedAccess && windowExpiresAt ? <div style={{ position: 'absolute', right: 0, top: 0 }}><CountdownTimer totalSeconds={initialSeconds} onExpire={onTimeout} /></div> : null}

        {stage === 'confirm' && yesterdaySeed ? (
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Before you plant tonight</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 44, marginBottom: 10 }}>Last night you planted:</h1>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 30, marginBottom: 24 }}>&quot;{yesterdaySeed.seed_text}&quot;</p>
            <p style={{ marginBottom: 16 }}>What happened?</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn-ghost-gold" style={{ minHeight: 54, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmYesterday(true)}>
                <span>It appeared in my dream</span>
              </button>
              <button className="btn-ghost-gold" style={{ minHeight: 54, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmYesterday(false)}>
                <span>It did not appear</span>
              </button>
              <button className="btn-ghost-gold" style={{ minHeight: 54, border: '1px solid #3a2c61', borderRadius: 10, justifyContent: 'flex-start', padding: '0 14px' }} onClick={() => void confirmYesterday(null)}>
                <span>I do not remember dreaming</span>
              </button>
            </div>
          </div>
        ) : null}

        {stage === 'journal-prompt' ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 42, marginBottom: 12 }}>Want to write about last night?</h2>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/journal/new" className="btn-gold">Write now</Link>
              <button className="btn-ghost-gold" onClick={() => setStage('plant')}>Skip</button>
            </div>
          </div>
        ) : null}

        {stage === 'plant' ? (
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Tonight's dream seed</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 44, marginBottom: 14 }}>What do you want to dream about?</h1>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 12 }}>
              {shownSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="btn-ghost-gold seed-card"
                  style={{ border: '1px solid #3a2c61', borderRadius: 10, minHeight: 56, justifyContent: 'flex-start', padding: '8px 12px', color: '#e7ddfa', textAlign: 'left' }}
                  onClick={() => setSeedText(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <button className="btn-ghost-gold" style={{ marginBottom: 14 }} onClick={() => setShownSuggestions(shuffle(SUGGESTIONS_40).slice(0, 6))}>Show different suggestions</button>
            <p style={{ color: '#9f8abb', marginBottom: 8 }}>OR</p>
            <textarea
              value={seedText}
              onChange={(event) => setSeedText(event.target.value.slice(0, 300))}
              placeholder="Write your own intention..."
              style={{
                width: '100%',
                minHeight: 120,
                borderRadius: 12,
                border: '1px solid rgba(201,168,76,0.45)',
                background: '#0f0a1d',
                color: '#fff',
                padding: 14,
                marginBottom: 8,
              }}
            />
            <div style={{ border: `1px solid ${guidance.color}`, borderRadius: 10, padding: '8px 10px', marginBottom: 8, color: guidance.color }}>
              {guidance.message}
            </div>
            <p style={{ textAlign: 'right', color: '#a88fd1', marginBottom: 12 }}>{seedText.length}/300 chars • {guidance.words} words</p>
            {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
            <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void plantSeed()} disabled={saving || !seedText.trim()}>
              {saving ? 'Planting...' : 'Plant this seed'}
            </button>
          </div>
        ) : null}

        {stage === 'planted' ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 58, marginBottom: 8 }}>Planted.</h1>
            <p style={{ color: '#c3b2df', maxWidth: 540, margin: '0 auto 10px' }}>
              Hold this thought as you fall asleep. Your morning window opens at {formatClock(parseTime(wakeTime).hour, parseTime(wakeTime).minute)}.
            </p>
            <p style={{ color: '#9f8abb', marginBottom: 16 }}>
              Dream incubation works best when the intention is the last thing you think about before sleeping.
            </p>
            <Link className="btn-gold" href="/dashboard">Go to sleep</Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
