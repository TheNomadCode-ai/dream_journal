'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { saveDream } from '@/lib/local-db'
import { isWindowOpen } from '@/lib/window'

type Props = {
  userId: string
  targetWakeTime: string
}

export default function JournalWindowClient({ userId, targetWakeTime }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [saving, setSaving] = useState(false)

  const windowState = useMemo(() => isWindowOpen(targetWakeTime), [targetWakeTime])
  const [open, setOpen] = useState(windowState.open)

  useEffect(() => {
    setOpen(windowState.open)
    setSecondsRemaining(windowState.secondsRemaining)
  }, [windowState.open, windowState.secondsRemaining])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = isWindowOpen(targetWakeTime)
      setOpen(next.open)
      setSecondsRemaining(next.secondsRemaining)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetWakeTime])

  useEffect(() => {
    if (!open) return
    const key = `somnia-journal-draft:${userId}:${new Date().toISOString().slice(0, 10)}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { title?: string; body?: string }
        setTitle(parsed.title ?? '')
        setBody(parsed.body ?? '')
      } catch {
        // no-op
      }
    }

    const autosave = window.setInterval(() => {
      localStorage.setItem(key, JSON.stringify({ title, body }))
    }, 30000)

    return () => window.clearInterval(autosave)
  }, [body, open, title, userId])

  async function handleSaveDream() {
    if (saving || !body.trim()) return
    setSaving(true)

    const today = new Date().toISOString().slice(0, 10)
    try {
      await saveDream({
        id: crypto.randomUUID(),
        date: today,
        content: body,
        createdAt: Date.now(),
      })
      localStorage.setItem('somnia_morning_entry_date', today)
      router.push('/dashboard')
      return
    } catch {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div style={{ minHeight: '100vh', background: '#06040f', color: '#f2ebff', display: 'grid', placeItems: 'center', padding: 22 }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 54, marginBottom: 8 }}>The window has closed.</h1>
          <p style={{ color: '#ccb7eb', marginBottom: 10 }}>
            Your 5 minute window opens at {new Date(`1970-01-01T${targetWakeTime.slice(0, 5)}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} tomorrow.
          </p>
          <p style={{ color: '#bca7de', marginBottom: 18 }}>Use the morning window to capture your entry tomorrow.</p>
          <Link href="/dashboard" className="btn-gold">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, '0')
  const seconds = String(secondsRemaining % 60).padStart(2, '0')

  const locked = secondsRemaining <= 0

  return (
    <div style={{ minHeight: '100vh', background: '#06040f', color: '#f2ebff', padding: '24px 18px 38px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#b9a4dc' }}>Journal Window</p>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 18, color: '#e9dbff' }}>{minutes}:{seconds}</p>
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={locked}
          placeholder="Title (optional)"
          style={{ width: '100%', minHeight: 48, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#120d24', color: '#fff', padding: '0 12px', marginBottom: 10 }}
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={locked}
          placeholder="Write what you remember..."
          style={{ width: '100%', minHeight: 360, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: '#120d24', color: '#fff', padding: 14, lineHeight: 1.65 }}
        />

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button className="btn-gold" onClick={handleSaveDream} disabled={locked || saving}>
            {saving ? 'Saving...' : 'Save Dream'}
          </button>
          <Link href="/dashboard" className="btn-ghost-gold">Cancel</Link>
        </div>

        {locked ? (
          <div style={{ marginTop: 14, border: '1px solid rgba(180,130,255,0.3)', borderRadius: 10, padding: 12, background: 'rgba(180,130,255,0.08)' }}>
            Your dream is saved. The window has closed.
          </div>
        ) : null}
      </div>
    </div>
  )
}
