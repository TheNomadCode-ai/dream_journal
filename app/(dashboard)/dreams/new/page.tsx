'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

const MOODS = [
  { score: 1, emoji: '😴', label: 'Restless'   },
  { score: 2, emoji: '😔', label: 'Melancholy' },
  { score: 3, emoji: '😐', label: 'Neutral'    },
  { score: 4, emoji: '🙂', label: 'Peaceful'   },
  { score: 5, emoji: '✨', label: 'Luminous'   },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function NewDreamPage() {
  const router = useRouter()
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [lucid, setLucid]         = useState(false)
  const [date, setDate]           = useState(todayISO())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [panelOpen, setPanelOpen] = useState(false)
  const [tags, setTags]           = useState('')
  const savedIdRef                = useRef<string | null>(null)
  const autoSaveTimerRef          = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef                  = useRef<HTMLTextAreaElement>(null)

  const triggerAutoSave = useCallback(async () => {
    if (!body.trim()) return
    setSaveState('saving')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        title: title.trim() || null,
        body_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] },
        body_text: body,
        mood_score: moodScore,
        lucid,
        date_of_dream: date,
      }

      if (savedIdRef.current) {
        await supabase.from('dreams').update(payload).eq('id', savedIdRef.current)
      } else {
        const { data } = await supabase.from('dreams').insert(payload).select('id').single()
        if (data) savedIdRef.current = data.id
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
    }
  }, [title, body, moodScore, lucid, date])

  useEffect(() => {
    if (!body.trim()) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(triggerAutoSave, 1800)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [body, title, moodScore, lucid, triggerAutoSave])

  async function handleFinish() {
    await triggerAutoSave()
    if (savedIdRef.current) router.push(`/dreams/${savedIdRef.current}`)
    else router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0B12', display: 'flex' }}>

      {/* ── Editor column ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 40px', borderBottom: '1px solid #1E2235',
          }}
        >
          <button onClick={() => router.push('/dashboard')} className="btn-ghost-gold" style={{ fontSize: '10px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Journal
          </button>

          {/* Auto-save indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px', justifyContent: 'center' }}>
            {saveState === 'saving' && (
              <>
                <span className="autosave-dot" />
                <span style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.12em', fontSize: '10px', fontWeight: 300, color: '#6B6F85', textTransform: 'uppercase' }}>Saving</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.12em', fontSize: '10px', fontWeight: 300, color: '#C9A84C', textTransform: 'uppercase' }}>Saved</span>
              </>
            )}
            {saveState === 'error' && (
              <span style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.12em', fontSize: '10px', fontWeight: 300, color: '#7a3a50', textTransform: 'uppercase' }}>Failed</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setPanelOpen(!panelOpen)} className="btn-ghost-gold" style={{ fontSize: '10px' }}>
              Details
            </button>
            <button onClick={handleFinish} className="btn-gold" style={{ padding: '10px 24px' }}>
              Done
            </button>
          </div>
        </div>

        {/* Writing area */}
        <div style={{ flex: 1, maxWidth: '680px', margin: '0 auto', width: '100%', padding: '60px 40px 80px' }}>

          {/* Title */}
          <textarea
            ref={titleRef}
            className="editor-title"
            placeholder="Untitled dream"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            rows={1}
            style={{ marginBottom: '10px', overflow: 'hidden', display: 'block' }}
          />

          {/* Date line */}
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '10px', fontWeight: 300, color: '#6B6F85', marginBottom: '30px' }}>
            {formatDisplayDate(date)}
          </p>

          {/* Mood row */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #1E2235' }}>
            {MOODS.map((m) => (
              <button
                key={m.score}
                onClick={() => setMoodScore(moodScore === m.score ? null : m.score)}
                title={m.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  opacity: moodScore === null || moodScore === m.score ? 1 : 0.22,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <span style={{ fontSize: '22px' }}>{m.emoji}</span>
                <span style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '8px', fontWeight: 300, color: moodScore === m.score ? '#C9A84C' : '#6B6F85' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Body */}
          <textarea
            className="editor-body"
            autoFocus
            placeholder="I was standing at the edge of something vast…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>

      {/* ── Collapsible right panel ───────────────────────────── */}
      <div
        style={{
          width: panelOpen ? '260px' : '0',
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          borderLeft: panelOpen ? '1px solid #1E2235' : 'none',
          flexShrink: 0,
          backgroundColor: '#0D0E18',
        }}
      >
        <div style={{ padding: '32px 24px', minWidth: '260px' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '10px', fontWeight: 300, color: '#6B6F85', marginBottom: '28px' }}>
            Entry details
          </p>

          {/* Date */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '9px', fontWeight: 300, color: '#6B6F85', display: 'block', marginBottom: '8px' }}>
              Date of dream
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ background: '#12141F', border: '1px solid #1E2235', borderRadius: '2px', padding: '8px 12px', color: '#E8E4D9', fontFamily: "'Josefin Sans', sans-serif", fontSize: '11px', letterSpacing: '0.08em', width: '100%', outline: 'none' }}
            />
          </div>

          {/* Lucid toggle */}
          <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '9px', fontWeight: 300, color: '#6B6F85' }}>
              Lucid dream
            </span>
            <button
              onClick={() => setLucid(!lucid)}
              style={{ width: '36px', height: '20px', borderRadius: '10px', background: lucid ? '#C9A84C' : '#1E2235', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', padding: 0 }}
            >
              <span style={{ position: 'absolute', top: '3px', left: lucid ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: lucid ? '#0A0B12' : '#6B6F85', transition: 'left 0.2s ease, background 0.2s ease', display: 'block' }} />
            </button>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '9px', fontWeight: 300, color: '#6B6F85', display: 'block', marginBottom: '8px' }}>
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="water, forest, figures…"
              style={{ background: '#12141F', border: '1px solid #1E2235', borderRadius: '2px', padding: '8px 12px', color: '#E8E4D9', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '15px', width: '100%', outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
