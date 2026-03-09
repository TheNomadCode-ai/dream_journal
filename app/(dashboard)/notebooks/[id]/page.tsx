'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { DreamListResponse, Dream } from '@/types/dream'
import type { Notebook, NotebookDetailResponse, NotebookDream } from '@/types/notebook'

type NotebookDetailPageProps = {
  params: { id: string }
}

export default function NotebookDetailPage({ params }: NotebookDetailPageProps) {
  const notebookId = params.id

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [dreams, setDreams] = useState<NotebookDream[]>([])
  const [allDreams, setAllDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDreamIds, setSelectedDreamIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)

  const [menuDreamId, setMenuDreamId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadNotebookData() {
      setLoading(true)
      setError(null)

      try {
        const notebookResponse = await fetch(`/api/notebooks/${notebookId}`, { cache: 'no-store' })
        if (!notebookResponse.ok) {
          throw new Error('Notebook load failed')
        }

        const notebookPayload = (await notebookResponse.json()) as NotebookDetailResponse

        const dreamsAccumulator: Dream[] = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const dreamsResponse = await fetch(`/api/dreams?page=${page}`, { cache: 'no-store' })
          if (!dreamsResponse.ok) {
            throw new Error('Dream load failed')
          }

          const dreamsPayload = (await dreamsResponse.json()) as DreamListResponse
          dreamsAccumulator.push(...dreamsPayload.dreams)
          hasMore = dreamsPayload.has_more
          page += 1

          if (page > 200) break
        }

        if (!active) return
        setNotebook(notebookPayload.notebook)
        setDreams(notebookPayload.dreams)
        setAllDreams(dreamsAccumulator)
      } catch {
        if (!active) return
        setError('Could not load this notebook right now. Please try again.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadNotebookData()

    return () => {
      active = false
    }
  }, [notebookId])

  const notebookDreamIds = useMemo(() => new Set(dreams.map((dream) => dream.id)), [dreams])

  const filteredAvailableDreams = useMemo(() => {
    return allDreams
      .filter((dream) => !notebookDreamIds.has(dream.id))
      .filter((dream) => {
        if (!search.trim()) return true
        const haystack = `${dream.title ?? ''} ${dream.body_text ?? ''}`.toLowerCase()
        return haystack.includes(search.trim().toLowerCase())
      })
      .sort((a, b) => (a.date_of_dream > b.date_of_dream ? -1 : 1))
  }, [allDreams, notebookDreamIds, search])

  function toggleDreamSelection(dreamId: string) {
    setSelectedDreamIds((current) => (
      current.includes(dreamId)
        ? current.filter((id) => id !== dreamId)
        : [...current, dreamId]
    ))
  }

  async function addSelectedDreams() {
    if (selectedDreamIds.length === 0) return

    setAdding(true)
    setError(null)

    try {
      const responses = await Promise.all(
        selectedDreamIds.map((dreamId) =>
          fetch(`/api/notebooks/${notebookId}/dreams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dream_id: dreamId }),
          })
        )
      )

      if (responses.some((response) => !response.ok)) {
        throw new Error('Could not add all dreams')
      }

      const addedDreams = allDreams.filter((dream) => selectedDreamIds.includes(dream.id)).map((dream) => ({
        id: dream.id,
        title: dream.title,
        body_text: dream.body_text,
        mood_score: dream.mood_score,
        lucid: dream.lucid,
        date_of_dream: dream.date_of_dream,
        created_at: dream.created_at,
      }))

      setDreams((current) => {
        const seen = new Set(current.map((dream) => dream.id))
        const next = [...current]
        addedDreams.forEach((dream) => {
          if (!seen.has(dream.id)) {
            next.push(dream)
          }
        })
        return next.sort((a, b) => (a.date_of_dream > b.date_of_dream ? -1 : 1))
      })

      setSelectedDreamIds([])
      setSearch('')
      setAddModalOpen(false)
    } catch {
      setError('Could not add dreams right now. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function removeDream(dreamId: string) {
    setError(null)

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/dreams/${dreamId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Could not remove dream')
      }

      setDreams((current) => current.filter((dream) => dream.id !== dreamId))
      setMenuDreamId(null)
    } catch {
      setError('Could not remove dream right now. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
        <div className="shimmer" style={{ height: 120, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>Notebook not found.</p>
        <Link href="/notebooks" className="btn-ghost-gold">Back to notebooks</Link>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '54px clamp(16px, 4vw, 40px) 120px' }}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/notebooks" className="btn-ghost-gold" style={{ marginBottom: 16 }}>← Back</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 10, color: '#6B6F85', marginBottom: 10 }}>
              Notebook
            </p>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(34px,4vw,46px)', color: '#E8E4D9', marginBottom: 8 }}>
              {notebook.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.56)', maxWidth: 560 }}>{notebook.description || 'No description yet.'}</p>
          </div>
          <button type="button" className="btn-gold" onClick={() => setAddModalOpen(true)}>Add dreams</button>
        </div>
      </header>

      {error ? (
        <p style={{ border: '1px solid rgba(190,90,100,0.45)', background: 'rgba(190,90,100,0.15)', borderRadius: 12, padding: 12, marginBottom: 18 }}>
          {error}
        </p>
      ) : null}

      {dreams.length === 0 ? (
        <section style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 38, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
              This notebook is empty.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Add dreams that belong together.</p>
            <button type="button" className="btn-gold" onClick={() => setAddModalOpen(true)}>Add dreams</button>
          </div>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dreams.map((dream) => (
            <article key={dream.id} className="dream-card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <Link href={`/dreams/${dream.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>
                    {new Date(dream.date_of_dream).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <h3 style={{ color: '#FFFFFF', fontSize: 18, marginBottom: 8 }}>{dream.title || 'Untitled dream'}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.58)', lineHeight: 1.55 }}>
                    {(dream.body_text ?? '').slice(0, 180) || 'No text available.'}
                  </p>
                </Link>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="notebook-menu-trigger"
                    onClick={() => setMenuDreamId((current) => (current === dream.id ? null : dream.id))}
                    aria-label="Open dream menu"
                  >
                    ⋯
                  </button>

                  {menuDreamId === dream.id ? (
                    <div className="notebook-card-menu">
                      <button type="button" onClick={() => removeDream(dream.id)}>
                        Remove from notebook
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {addModalOpen ? (
        <div className="notebook-modal-overlay" role="dialog" aria-modal="true" aria-label="Add dreams">
          <div className="notebook-modal" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 30, color: '#E8E4D9' }}>Add dreams</p>
              <button type="button" className="notebook-close" onClick={() => setAddModalOpen(false)} aria-label="Close">×</button>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="notebook-input"
              placeholder="Search dreams"
              style={{ marginBottom: 12 }}
            />

            <div style={{ maxHeight: '48vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              {filteredAvailableDreams.length === 0 ? (
                <p style={{ padding: 14, color: 'rgba(255,255,255,0.52)' }}>No matching dreams to add.</p>
              ) : (
                filteredAvailableDreams.map((dream) => (
                  <label key={dream.id} className="notebook-dream-option">
                    <input
                      type="checkbox"
                      checked={selectedDreamIds.includes(dream.id)}
                      onChange={() => toggleDreamSelection(dream.id)}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: 3 }}>{dream.title || 'Untitled dream'}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        {(dream.body_text ?? '').slice(0, 90) || 'No text'}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <button
              type="button"
              className="btn-gold"
              style={{ marginTop: 14 }}
              onClick={addSelectedDreams}
              disabled={adding || selectedDreamIds.length === 0}
            >
              {adding ? 'Adding...' : 'Add selected'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
