'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ValidateResponse = {
  allowed?: boolean
  started?: boolean
  seconds_remaining?: number
  window_id?: string
  reason?: string
  next_alarm_label?: string
  dream_id?: string
}

type Props = {
  initialWindowId: string | null
}

type ViewState = 'loading' | 'capture' | 'locked' | 'completed'

export default function CapturePageClient({ initialWindowId }: Props) {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [windowId, setWindowId] = useState<string | null>(initialWindowId)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [entryStarted, setEntryStarted] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [lockedReason, setLockedReason] = useState<string>('The window has closed.')
  const [lockedSubtext, setLockedSubtext] = useState<string>('Your 2-minute window for today has passed.')
  const [nextAlarmLabel, setNextAlarmLabel] = useState<string | null>(null)
  const [completedDreamId, setCompletedDreamId] = useState<string | null>(null)

  const firstStartCalledRef = useRef(false)
  const endTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  const ring = useMemo(() => {
    const radius = 46
    const circumference = 2 * Math.PI * radius
    const total = 120
    const current = secondsLeft ?? 0
    const progress = Math.max(0, Math.min(1, current / total))
    const dashOffset = circumference * (1 - progress)

    let stroke = '#C9A84C'
    if (current <= 20) stroke = '#C56161'
    else if (current <= 60) stroke = '#D08A54'

    return { radius, circumference, dashOffset, stroke }
  }, [secondsLeft])

  const validate = useCallback(async (requestedWindowId?: string | null) => {
    const query = requestedWindowId ? `?window_id=${requestedWindowId}` : ''
    const response = await fetch(`/api/capture/validate${query}`, { cache: 'no-store' })

    if (response.status === 401) {
      const target = requestedWindowId ? `/capture?window_id=${requestedWindowId}` : '/capture'
      router.replace(`/login?redirectedFrom=${encodeURIComponent(target)}`)
      return null
    }

    const data = (await response.json()) as ValidateResponse
    return data
  }, [router])

  const handleExpiry = useCallback(async () => {
    const data = await validate(windowId)
    if (!data) return

    if (data.allowed) return

    setLockedReason('The window has closed.')
    setLockedSubtext('Your 2-minute window for today has passed.')
    setViewState('locked')
  }, [validate, windowId])

  const runTimer = useCallback((startSeconds: number) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)

    endTimeRef.current = Date.now() + startSeconds * 1000

    const tick = () => {
      if (!endTimeRef.current) return
      const remaining = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        handleExpiry()
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [handleExpiry])

  useEffect(() => {
    let active = true

    async function init() {
      const data = await validate(windowId)
      if (!active || !data) return

      if (data.reason === 'no_alarm') {
        router.replace('/dashboard?banner=set-alarm')
        return
      }

      if (data.reason === 'already_captured') {
        setCompletedDreamId(data.dream_id ?? null)
        setViewState('completed')
        return
      }

      if (data.reason === 'no_active_window') {
        setNextAlarmLabel(data.next_alarm_label ?? null)
        setLockedReason('The window has closed.')
        setLockedSubtext(
          data.next_alarm_label
            ? `Next window: Tomorrow at ${data.next_alarm_label}`
            : 'Come back tomorrow.'
        )
        setViewState('locked')
        return
      }

      if (!data.allowed) {
        setViewState('locked')
        return
      }

      const resolvedWindowId = data.window_id ?? windowId
      if (resolvedWindowId && resolvedWindowId !== windowId) {
        setWindowId(resolvedWindowId)
        router.replace(`/capture?window_id=${resolvedWindowId}`)
      }

      const started = !!data.started
      setEntryStarted(started)
      setViewState('capture')

      const draftKey = resolvedWindowId ? `somnia-capture-draft:${resolvedWindowId}` : null
      if (draftKey && typeof window !== 'undefined') {
        const draft = window.localStorage.getItem(draftKey)
        if (draft) {
          try {
            const parsed = JSON.parse(draft) as { title?: string; body?: string }
            setTitle(parsed.title ?? '')
            setBody(parsed.body ?? '')
          } catch {
            // ignore malformed draft
          }
        }
      }

      if (!started && typeof data.seconds_remaining === 'number') {
        runTimer(data.seconds_remaining)
      } else {
        setSecondsLeft(null)
      }
    }

    init()

    return () => {
      active = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [router, runTimer, validate, windowId])

  useEffect(() => {
    if (!windowId || entryStarted || viewState !== 'capture') return

    const timer = window.setInterval(async () => {
      const data = await validate(windowId)
      if (!data) return
      if (!data.allowed) {
        setViewState('locked')
        return
      }
      if (data.started) {
        setEntryStarted(true)
        setSecondsLeft(null)
      }
    }, 10000)

    return () => window.clearInterval(timer)
  }, [entryStarted, validate, viewState, windowId])

  useEffect(() => {
    if (!windowId || typeof window === 'undefined') return
    const key = `somnia-capture-draft:${windowId}`
    window.localStorage.setItem(key, JSON.stringify({ title, body }))
  }, [body, title, windowId])

  async function markStarted() {
    if (!windowId || firstStartCalledRef.current) return
    firstStartCalledRef.current = true

    const response = await fetch('/api/capture/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ window_id: windowId }),
    })

    if (response.ok) {
      setEntryStarted(true)
      setSecondsLeft(null)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }

  async function saveDream() {
    if (!windowId || !body.trim()) return

    setSaving(true)

    const response = await fetch('/api/capture/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        window_id: windowId,
        title,
        body_json: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
        },
      }),
    })

    const data = await response.json().catch(() => ({})) as { dreamId?: string }
    setSaving(false)

    if (response.ok && data.dreamId) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`somnia-capture-draft:${windowId}`)
      }
      router.push(`/dreams/${data.dreamId}`)
    }
  }

  if (viewState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0A0B12', color: '#E8E4D9' }}>
        <p style={{ color: '#6B6F85', fontSize: 14 }}>Checking your entry window…</p>
      </div>
    )
  }

  if (viewState === 'completed') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0A0B12', color: '#E8E4D9', padding: 24 }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 44, marginBottom: 8, color: 'rgba(255,255,255,0.82)' }}>
            You already captured today&apos;s dream.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>Your morning window has already been used.</p>
          {completedDreamId ? (
            <Link href={`/dreams/${completedDreamId}`} className="btn-gold">View Entry</Link>
          ) : (
            <Link href="/dashboard" className="btn-gold">Go to Journal</Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0B12', color: '#E8E4D9', padding: '28px 18px 36px', position: 'relative' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10, color: '#6B6F85' }}>
            Timed capture
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-ghost-gold" style={{ fontSize: 10 }}>
            Skip
          </button>
        </header>

        <div style={{ border: '1px solid #1E2235', background: '#12141F', borderRadius: 16, padding: 18, marginBottom: 14 }}>
          {!entryStarted && typeof secondsLeft === 'number' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <svg width="110" height="110" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={ring.radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r={ring.radius}
                  fill="none"
                  stroke={ring.stroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ring.circumference}
                  strokeDashoffset={ring.dashOffset}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="66" textAnchor="middle" fill={ring.stroke} fontSize="24" fontFamily="Josefin Sans">
                  {secondsLeft}
                </text>
              </svg>
              <div>
                <p style={{ color: '#E8E4D9', fontSize: 16, marginBottom: 4 }}>What did you dream?</p>
                <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 13, lineHeight: 1.5 }}>
                  The clock started when your alarm fired. Begin now to keep the entry open.
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', marginBottom: 10 }}>
              Keep writing…
            </p>
          )}

          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (!entryStarted && event.target.value.length > 0) markStarted()
            }}
            placeholder="Title (optional)"
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#E8E4D9',
              padding: '0 14px',
              marginBottom: 10,
            }}
          />

          <textarea
            value={body}
            disabled={viewState === 'locked'}
            onChange={(event) => {
              setBody(event.target.value)
              if (!entryStarted && event.target.value.length > 0) markStarted()
            }}
            placeholder="Begin with the first image you remember..."
            style={{
              width: '100%',
              minHeight: 280,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#E8E4D9',
              padding: '14px',
              lineHeight: 1.7,
              resize: 'vertical',
            }}
          />

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-ghost-gold"
              style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10 }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={saveDream}
              disabled={saving || !body.trim()}
              style={{
                minHeight: 48,
                borderRadius: 10,
                background: '#FFFFFF',
                color: '#000000',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving…' : 'Save Dream'}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,11,18,0.78)',
          backdropFilter: 'blur(2px)',
          display: viewState === 'locked' ? 'grid' : 'none',
          placeItems: 'center',
          padding: 24,
          opacity: viewState === 'locked' ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 48, color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>
            {lockedReason}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.54)', fontSize: 16, marginBottom: 8 }}>
            {lockedSubtext}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.34)', fontSize: 12, marginBottom: 18 }}>
            {nextAlarmLabel ? `Next window: Tomorrow at ${nextAlarmLabel}` : 'Come back tomorrow.'}
          </p>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-gold">
            Go to Journal
          </button>
        </div>
      </div>
    </div>
  )
}
