'use client'

import { toBlob, toPng } from 'html-to-image'
import { useMemo, useRef, useState } from 'react'

type DreamShareCardDialogProps = {
  bodyText: string | null
  dateOfDream: string
  moodScore: number | null
  lucid: boolean
}

function formatLongDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function createDefaultExcerpt(bodyText: string | null): string {
  const text = (bodyText ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return 'A dream worth remembering.'
  return text.slice(0, 200)
}

function clampLines(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= 220) return trimmed
  return `${trimmed.slice(0, 217)}...`
}

function MoodDots({ moodScore }: { moodScore: number | null }) {
  if (!moodScore) return null

  return (
    <span style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: '0.12em' }}>
      {Array.from({ length: 5 }).map((_, index) => (index < moodScore ? '●' : '○')).join('')}
    </span>
  )
}

export default function DreamShareCardDialog({
  bodyText,
  dateOfDream,
  moodScore,
  lucid,
}: DreamShareCardDialogProps) {
  const [open, setOpen] = useState(false)
  const [excerptInput, setExcerptInput] = useState(createDefaultExcerpt(bodyText))
  const [previewExcerpt, setPreviewExcerpt] = useState(createDefaultExcerpt(bodyText))
  const [downloadState, setDownloadState] = useState<'idle' | 'done'>('idle')
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle')
  const [actionError, setActionError] = useState<string | null>(null)

  const exportCardRef = useRef<HTMLDivElement>(null)

  const dateLabel = useMemo(() => formatLongDate(dateOfDream), [dateOfDream])
  const canCopy = typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write

  function closeDialog() {
    setOpen(false)
    setActionError(null)
    setDownloadState('idle')
    setCopyState('idle')
  }

  function regeneratePreview() {
    const next = clampLines(excerptInput || createDefaultExcerpt(bodyText))
    setPreviewExcerpt(next)
  }

  async function handleDownload() {
    if (!exportCardRef.current) return
    setActionError(null)

    try {
      const dataUrl = await toPng(exportCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#050510',
      })

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `somnia-dream-${dateOfDream}.png`
      a.click()
      setDownloadState('done')
      window.setTimeout(() => setDownloadState('idle'), 2000)
    } catch {
      setActionError('Could not generate image right now. Please try again.')
    }
  }

  async function handleCopy() {
    if (!canCopy || !exportCardRef.current) return
    setActionError(null)

    try {
      const blob = await toBlob(exportCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#050510',
      })

      if (!blob) {
        throw new Error('Missing blob')
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopyState('done')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setActionError('Copy is not available in this browser. Use Download instead.')
    }
  }

  return (
    <>
      <button type="button" className="dream-share-button" onClick={() => setOpen(true)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
        </svg>
        Share
      </button>

      {open ? (
        <div className="dream-share-overlay" role="dialog" aria-modal="true" aria-label="Share this dream">
          <div className="dream-share-modal">
            <button type="button" className="dream-share-close" onClick={closeDialog} aria-label="Close share dialog">
              ×
            </button>

            <p className="dream-share-label">Choose what to share - edit before generating</p>
            <textarea
              className="dream-share-textarea"
              value={excerptInput}
              onChange={(event) => setExcerptInput(event.target.value)}
              rows={4}
            />

            <button type="button" className="dream-share-regenerate" onClick={regeneratePreview}>
              Regenerate
            </button>

            <div className="dream-share-preview-shell">
              <div className="dream-share-card preview-card">
                <div className="dream-share-noise" />
                <div className="dream-share-top-row">
                  <span className="dream-share-wordmark">☾ Somnia</span>
                </div>
                <p className="dream-share-excerpt">{previewExcerpt}</p>
                <p className="dream-share-date">{dateLabel}</p>
                <div className="dream-share-bottom-row">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <MoodDots moodScore={moodScore} />
                    {lucid ? <span className="dream-share-lucid">Lucid</span> : null}
                  </div>
                  <span className="dream-share-domain">somnia.app</span>
                </div>
              </div>
            </div>

            <div className="dream-share-actions">
              <button type="button" className="btn-gold" onClick={handleDownload}>
                {downloadState === 'done' ? 'Downloaded' : 'Download'}
              </button>
              {canCopy ? (
                <button type="button" className="dream-share-copy" onClick={handleCopy}>
                  {copyState === 'done' ? 'Copied' : 'Copy image'}
                </button>
              ) : null}
            </div>

            {actionError ? <p className="dream-share-error">{actionError}</p> : null}
          </div>

          <div style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
            <div ref={exportCardRef} className="dream-share-card export-card">
              <div className="dream-share-noise" />
              <div className="dream-share-top-row">
                <span className="dream-share-wordmark">☾ Somnia</span>
              </div>
              <p className="dream-share-excerpt">{previewExcerpt}</p>
              <p className="dream-share-date">{dateLabel}</p>
              <div className="dream-share-bottom-row">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <MoodDots moodScore={moodScore} />
                  {lucid ? <span className="dream-share-lucid">Lucid</span> : null}
                </div>
                <span className="dream-share-domain">somnia.app</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
