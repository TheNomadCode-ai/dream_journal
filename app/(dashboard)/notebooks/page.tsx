'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import UpgradePrompt from '@/components/UpgradePrompt'
import { LIMITS, type Tier } from '@/lib/tier-config'
import { canShowUpgradePrompt, markUpgradePromptSeen } from '@/lib/upgrade-prompt-session'
import type { Notebook, NotebookListResponse } from '@/types/notebook'

const COLOR_OPTIONS = ['4F46E5', '7C3AED', '0891B2', '16A34A', 'D97706', 'BE123C']

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [tier, setTier] = useState<Tier>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    let active = true

    async function loadNotebooks() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/notebooks', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Could not load notebooks')
        }

        const payload = (await response.json()) as NotebookListResponse
        if (!active) return
        setNotebooks(payload.notebooks)
        if (payload.tier) {
          setTier(payload.tier)
        }
      } catch {
        if (!active) return
        setError('Could not load notebooks right now. Please refresh and try again.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadNotebooks()

    return () => {
      active = false
    }
  }, [])

  const canCreate = useMemo(() => name.trim().length > 0 && !creating, [creating, name])
  const freeNotebookLimitReached = tier === 'free' && notebooks.length >= LIMITS.free.maxNotebooks

  function openUpgradeModal(featureKey: string) {
    if (!canShowUpgradePrompt(featureKey)) return

    setShowUpgradeModal(true)
    markUpgradePromptSeen(featureKey)
  }

  function closeUpgradeModal() {
    setShowUpgradeModal(false)
  }

  function onNewNotebookClick() {
    if (freeNotebookLimitReached) {
      openUpgradeModal('notebook-limit')
      return
    }

    setModalOpen(true)
  }

  async function createNotebook() {
    if (!name.trim()) return
    setCreating(true)
    setCreateError(null)

    try {
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          cover_color: color,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
        if (response.status === 403 && payload?.error === 'notebook_limit_reached') {
          setModalOpen(false)
          openUpgradeModal('notebook-limit')
          return
        }

        throw new Error(payload?.message || 'Could not create notebook')
      }

      const created = (await response.json()) as Notebook
      setNotebooks((current) => [created, ...current])
      setModalOpen(false)
      setName('')
      setDescription('')
      setColor(COLOR_OPTIONS[0])
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create notebook right now. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 10, color: '#6B6F85', marginBottom: 12 }}>
            Notebooks
          </p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(34px,4vw,46px)', color: '#E8E4D9' }}>
            Organise your dream worlds.
          </h1>
        </div>
        <button type="button" className="btn-gold" onClick={onNewNotebookClick}>
          New Notebook
        </button>
      </header>

      {error ? (
        <p style={{ border: '1px solid rgba(190,90,100,0.45)', background: 'rgba(190,90,100,0.15)', borderRadius: 12, padding: 12, marginBottom: 18 }}>
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="notebook-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="notebook-card shimmer" style={{ minHeight: 150 }} />
          ))}
        </div>
      ) : null}

      {!loading && notebooks.length === 0 ? (
        <section style={{ minHeight: '52vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 38, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
              No notebooks yet.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Group your dreams by theme, period, or recurring place.
            </p>
            <button type="button" className="btn-gold" onClick={onNewNotebookClick}>
              Create your first notebook
            </button>
          </div>
        </section>
      ) : null}

      {!loading && notebooks.length > 0 ? (
        <section className="notebook-grid">
          {notebooks.map((notebook) => (
            <Link href={`/notebooks/${notebook.id}`} key={notebook.id} className="notebook-card">
              <span className="notebook-card-accent" style={{ background: `#${notebook.cover_color}` }} aria-hidden="true" />
              <div>
                <h3 style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 700, marginBottom: 8 }}>{notebook.name}</h3>
                <p className="notebook-card-desc">{notebook.description || 'No description yet.'}</p>
              </div>
              <p className="notebook-card-count">{notebook.dream_count ?? 0} dreams</p>
            </Link>
          ))}
        </section>
      ) : null}

      {modalOpen ? (
        <div className="notebook-modal-overlay" role="dialog" aria-modal="true" aria-label="Create notebook">
          <div className="notebook-modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 30, color: '#E8E4D9' }}>New Notebook</p>
              <button type="button" className="notebook-close" onClick={() => setModalOpen(false)} aria-label="Close">×</button>
            </div>

            <label className="notebook-field-label" htmlFor="notebook-name">Name</label>
            <input
              id="notebook-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="notebook-input"
              placeholder="Nightmares, Childhood Places, Flying..."
            />

            <label className="notebook-field-label" htmlFor="notebook-description">Description</label>
            <textarea
              id="notebook-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="notebook-textarea"
              rows={3}
              placeholder="Optional"
            />

            <p className="notebook-field-label" style={{ marginBottom: 8 }}>Cover color</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {COLOR_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setColor(option)}
                  className={`notebook-swatch${color === option ? ' active' : ''}`}
                  style={{ background: `#${option}` }}
                  aria-label={`Color ${option}`}
                />
              ))}
            </div>

            {createError ? <p style={{ color: 'rgba(255,160,160,0.95)', fontSize: 13, marginBottom: 10 }}>{createError}</p> : null}

            <button type="button" className="btn-gold" onClick={createNotebook} disabled={!canCreate}>
              {creating ? 'Creating...' : 'Create Notebook'}
            </button>
          </div>
        </div>
      ) : null}

      {showUpgradeModal ? (
        <UpgradePrompt
          variant="modal"
          featureName="Unlimited Notebooks"
          description="Organise your dreams into as many collections as you need with Pro."
          onClose={closeUpgradeModal}
        />
      ) : null}
    </div>
  )
}
