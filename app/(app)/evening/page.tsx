'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import CountdownTimer from '@/components/ui/CountdownTimer'
import { useApp } from '@/context/AppContext'
import { addMinutes, dateKeyLocal, formatClock, minusMinutes, parseTime, windowForToday } from '@/lib/dream-cycle'
import { getSeedByDate, saveSeed, updateSeed, type SeedEntry } from '@/lib/local-db'
import { createClient } from '@/lib/supabase/client'

type SeedRow = SeedEntry

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

type Stage = 'upcoming' | 'closed' | 'confirm' | 'journal-prompt' | 'plant' | 'planted' | 'upgrade' | 'already-planted'

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

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getDescriptiveness(text: string) {
  const len = text.length
  const wordCount = getWordCount(text)

  if (len === 0) return null

  if (wordCount <= 2) {
    return {
      message: 'Be more specific',
      color: 'rgba(255,100,100,0.7)',
    }
  }

  if (wordCount <= 5) {
    return {
      message: 'Add more detail',
      color: 'rgba(255,160,60,0.7)',
    }
  }

  if (wordCount <= 10) {
    return {
      message: 'Getting vivid',
      color: 'rgba(255,210,80,0.7)',
    }
  }

  if (wordCount <= 20) {
    return {
      message: 'Good detail',
      color: 'rgba(120,220,140,0.7)',
    }
  }

  return {
    message: 'Very detailed',
    color: 'rgba(100,200,255,0.7)',
  }
}

function EveningSkeleton() {
  return (
    <section style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: '#100a22', padding: 16 }}>
      <p style={{ color: '#bca7de' }}>Loading tonight&apos;s window and your seed status...</p>
    </section>
  )
}

export default function EveningPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { profile: appProfile, user: appUser, loading: appLoading, setProfile: setAppProfile } = useApp()

  const [profile, setProfile] = useState({
    target_sleep_time: '23:00',
    target_wake_time: '07:00',
  })
  const [loaded, setLoaded] = useState(false)
  const [stage, setStage] = useState<Stage>('plant')
  const [userId, setUserId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('07:00:00')
  const [sleepTime, setSleepTime] = useState('23:00:00')
  const [windowOpenedAt, setWindowOpenedAt] = useState<Date | null>(null)
  const [windowExpiresAt, setWindowExpiresAt] = useState<Date | null>(null)
  const [minutesUntilWindow, setMinutesUntilWindow] = useState(0)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [existingSeedToday, setExistingSeedToday] = useState<SeedRow | null>(null)
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
        router.replace('/login?redirectedFrom=%2Fevening')
        return
      }

      if (!active) return

      setUserId(user.id)

      let freshProfile = appProfile
      if (!freshProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        freshProfile = data
        if (data) setAppProfile(data)
      }

      console.log('[Evening] Fresh profile:', freshProfile?.target_sleep_time)
      setProfile({
        target_sleep_time: (freshProfile?.target_sleep_time ?? '23:00:00').slice(0, 5),
        target_wake_time: (freshProfile?.target_wake_time ?? '07:00:00').slice(0, 5),
      })
      const wake = freshProfile?.target_wake_time ?? '07:00:00'
      const sleep = freshProfile?.target_sleep_time ?? '23:00:00'
      setWakeTime(wake)
      setSleepTime(sleep)
      setLoaded(true)

      const tier = freshProfile?.tier ?? 'free'
      const trialActive = Boolean(freshProfile?.trial_ends_at) && new Date(freshProfile?.trial_ends_at ?? '').getTime() > Date.now()
      const trialHasEnded = tier === 'free' && Boolean(freshProfile?.trial_ends_at) && !trialActive
      const canPlantSeeds = tier === 'pro' || trialActive
      setHasSeedAccess(canPlantSeeds)
      setTrialEnded(trialHasEnded)

      const [h, m] = sleep.split(':').map(Number)
      const nowH = new Date().getHours()
      const nowM = new Date().getMinutes()
      const nowTotal = nowH * 60 + nowM
      const sleepTotal = h * 60 + m
      const windowStart = sleepTotal - 10
      const windowEnd = sleepTotal
      const windowOpen = nowTotal >= windowStart && nowTotal <= windowEnd

      const sleepParts = parseTime(sleep, '23:00:00')
      const notif = minusMinutes(sleepParts.hour, sleepParts.minute, 10)
      const windowState = windowForToday(notif.hour, notif.minute, 10)
      const seconds = Math.max(0, Math.ceil((windowState.expiresAt.getTime() - Date.now()) / 1000))

      console.log('[Evening] Window check:', {
        nowMinutes: nowTotal,
        windowStart,
        windowEnd,
        windowOpen,
        minutesUntilWindow: windowStart - nowTotal,
      })

      setWindowOpenedAt(windowState.openedAt)
      setWindowExpiresAt(windowState.expiresAt)
      setMinutesUntilWindow(Math.max(0, windowStart - nowTotal))
      setInitialSeconds(seconds)

      if (!canPlantSeeds) {
        setStage('upgrade')
        return
      }

      const today = dateKeyLocal(0)
      const existingSeed = await getSeedByDate(today)

      if (existingSeed) {
        setExistingSeedToday(existingSeed)
        setStage('already-planted')
        return
      }

      if (windowOpen) {
        // continue
      } else if (windowStart - nowTotal > 0) {
        setStage('upcoming')
        return
      } else if (nowTotal > windowEnd) {
        setStage('closed')
        return
      }

      const yesterday = dateKeyLocal(-1)
      const priorSeed = await getSeedByDate(yesterday)

      if (!active) return

      setYesterdaySeed(priorSeed)

      const draftKey = `somnia-evening-draft:${user.id}:${dateKeyLocal(0)}`
      const storedDraft = localStorage.getItem(draftKey)
      if (storedDraft) {
        setSeedText(storedDraft)
      }

      if (priorSeed && priorSeed.wasDreamed === null) {
        setStage('confirm')
        return
      }

      setStage('plant')
    }

    void load()

    return () => {
      active = false
    }
  }, [appLoading, appProfile, appUser, router, setAppProfile, supabase])

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

    await updateSeed(yesterdaySeed.date, {
      wasDreamed: value,
    })

    setYesterdaySeed({ ...yesterdaySeed, wasDreamed: value })
    setStage('journal-prompt')
  }

  async function plantSeed() {
    if (!userId || !windowOpenedAt || !seedText.trim()) return
    if (saving) return

    if (wordCount > 500) {
      setError('500 word maximum')
      return
    }

    setSaving(true)
    setError(null)

    const today = dateKeyLocal(0)
    void windowOpenedAt
    void addMinutes(windowOpenedAt, 10)

    try {
      await saveSeed({
        id: crypto.randomUUID(),
        date: today,
        seedText: seedText.trim(),
        wasDreamed: null,
        morningEntryWritten: false,
        createdAt: Date.now(),
      })
    } catch {
      setError('Could not plant seed. Try again.')
      setSaving(false)
      return
    }

    const draftKey = `somnia-evening-draft:${userId}:${dateKeyLocal(0)}`
    localStorage.removeItem(draftKey)
    localStorage.setItem('somnia_seed_planted_date', dateKeyLocal(0))

    console.log('[Evening] Seed planted:', seedText.trim())

    setSaving(false)
    setStage('planted')
  }

  const descriptiveness = getDescriptiveness(seedText)
  const wordCount = getWordCount(seedText)
  const sleepParts = parseTime(loaded ? sleepTime : `${profile.target_sleep_time}:00`, '23:00:00')
  const eveningParts = minusMinutes(sleepParts.hour, sleepParts.minute, 10)

  const wakeParts = parseTime(wakeTime, '07:00:00')
  function formatTime(h: number, m: number) {
    const hour24 = ((h % 24) + 24) % 24
    const minute = ((m % 60) + 60) % 60
    const period = hour24 >= 12 ? 'PM' : 'AM'
    const displayH = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24
    const displayM = minute.toString().padStart(2, '0')
    return `${displayH}:${displayM} ${period}`
  }
  const wakeTotal = wakeParts.hour * 60 + wakeParts.minute
  const windowStartTotal = wakeTotal - 120
  const windowStartHour = Math.floor(windowStartTotal / 60)
  const windowStartMinute = windowStartTotal % 60
  const openTime = formatTime(windowStartHour, windowStartMinute)
  const closeTime = formatTime(wakeParts.hour, wakeParts.minute)

  if (!loaded) {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
        <section style={{ width: 'min(760px, 100%)', margin: '0 auto', position: 'relative' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Tonight's dream seed</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 44, marginBottom: 14 }}>What do you want to dream about?</h1>
          <EveningSkeleton />
        </section>
      </main>
    )
  }

  if (stage === 'closed') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 50, marginBottom: 12 }}>The planting window has closed.</h1>
          <p style={{ color: '#bca7de', marginBottom: 8 }}>Tonight's window was at {formatClock(eveningParts.hour, eveningParts.minute)}.</p>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>It opens again tomorrow at {formatClock(eveningParts.hour, eveningParts.minute)}.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  if (stage === 'upcoming') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(680px, 100%)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 50, marginBottom: 12 }}>Tonight's window opens at {formatClock(eveningParts.hour, eveningParts.minute)}.</h1>
          <p style={{ color: '#bca7de', marginBottom: 20 }}>Opens in {minutesUntilWindow} minute{minutesUntilWindow === 1 ? '' : 's'}.</p>
          <Link className="btn-gold" href="/dashboard">Go to Dashboard</Link>
        </section>
      </main>
    )
  }

  if (stage === 'upgrade') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 24, display: 'grid', placeItems: 'center' }}>
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

  if (stage === 'planted') {
    return (
      <main
        className="page-content"
        style={{
          minHeight: '100vh',
          background: '#06040f',
          color: '#efe8ff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 24px 44px',
          animation: 'fadeIn 400ms ease forwards',
        }}
      >
        <div />

        <section style={{ textAlign: 'center', width: 'min(760px, 100%)', margin: '0 auto' }}>
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 20 }}>
            <svg width="72" height="72" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 16px rgba(180,130,255,0.8))' }} aria-hidden>
              <defs>
                <radialGradient id="mg-evening-planted" cx="32%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="rgba(240,225,255,1)" />
                  <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#mg-evening-planted)" />
              <circle cx="66" cy="44" r="35" fill="#06040f" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 58, marginBottom: 10 }}>Planted.</h1>
          <p style={{ color: '#bca7de', fontStyle: 'italic', marginBottom: 28 }}>
            Your subconscious will work on this while you sleep.
          </p>

          <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.08)', margin: '32px auto' }} />

          <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 16 }}>
            Morning Window
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: 'rgba(255,255,255,0.90)', marginBottom: 6 }}>{openTime}</p>
              <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase' }}>opens</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>-</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: 'rgba(255,255,255,0.90)', marginBottom: 6 }}>{closeTime}</p>
              <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase' }}>closes</p>
            </div>
          </div>

          <p style={{ color: '#9f8abb', fontStyle: 'italic', maxWidth: 420, margin: '0 auto' }}>
            Open Somnia tomorrow between these times to capture what you dreamed.
          </p>
        </section>

        <section style={{ width: 'min(760px, 100%)', margin: '0 auto', textAlign: 'center' }}>
          <button
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', minHeight: 54 }}
            onClick={() => {
              window.close()
              window.setTimeout(() => {
                window.location.href = '/dashboard'
              }, 220)
            }}
          >
            Close Somnia
          </button>
          <p style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Sleep well.</p>
        </section>
      </main>
    )
  }

  if (stage === 'already-planted') {
    return (
      <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(700px, 100%)', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 18 }}>
            <svg width="62" height="62" viewBox="0 0 100 100" style={{ opacity: 0.55 }} aria-hidden>
              <defs>
                <radialGradient id="mg-evening-locked" cx="32%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="rgba(220,200,250,0.6)" />
                  <stop offset="100%" stopColor="rgba(120,90,180,0.35)" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#mg-evening-locked)" />
              <circle cx="66" cy="44" r="35" fill="#06040f" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 54, marginBottom: 10 }}>Already planted.</h1>
          <p style={{ color: '#bca7de', fontStyle: 'italic', marginBottom: 10 }}>You planted tonight's seed.</p>

          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 24,
              borderRadius: 8,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'rgba(255,255,255,0.70)',
              maxWidth: 320,
              margin: '24px auto',
            }}
          >
            {existingSeedToday?.seedText}
          </div>

          <p style={{ color: '#9f8abb', marginBottom: 8 }}>Morning window: {openTime} - {closeTime}</p>
          <p style={{ color: '#9f8abb', marginBottom: 18 }}>You have until {closeTime} to capture.</p>
          <button className="btn-ghost-gold" onClick={() => { window.location.href = '/dashboard' }}>
            Go to dashboard
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-enter page-content" style={{ minHeight: '100vh', background: '#06040f', color: '#efe8ff', padding: 22 }}>
      <section style={{ width: 'min(760px, 100%)', margin: '0 auto', position: 'relative' }}>
        {hasSeedAccess && windowExpiresAt ? <div style={{ position: 'absolute', right: 0, top: 0 }}><CountdownTimer totalSeconds={initialSeconds} onExpire={onTimeout} /></div> : null}

        {stage === 'confirm' && yesterdaySeed ? (
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aa95cd', fontSize: 11, marginBottom: 8 }}>Before you plant tonight</p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 44, marginBottom: 10 }}>Last night you planted:</h1>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 30, marginBottom: 24 }}>&quot;{yesterdaySeed.seedText}&quot;</p>
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
              onChange={(event) => setSeedText(event.target.value)}
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
            {seedText.length > 0 && descriptiveness ? (
              <p
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  marginTop: '8px',
                  marginBottom: 8,
                  transition: 'color 0.4s ease',
                  color: descriptiveness.color,
                }}
              >
                {descriptiveness.message}
              </p>
            ) : null}
            {seedText.length > 0 ? <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: '4px', marginBottom: 12 }}>{wordCount} / 500 words</p> : null}
            {wordCount > 500 ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>500 word maximum</p> : null}
            {error ? <p style={{ color: '#ffb6b6', marginBottom: 10 }}>{error}</p> : null}
            <button className={`btn-gold ${saving ? 'btn-loading' : ''}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void plantSeed()} disabled={saving || !seedText.trim() || wordCount > 500}>
              {saving ? 'Planting...' : 'Plant this seed'}
            </button>
          </div>
        ) : null}

      </section>
    </main>
  )
}
