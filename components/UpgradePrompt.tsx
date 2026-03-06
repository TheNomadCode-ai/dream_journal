'use client'

import Link from 'next/link'
import { useEffect, useState, type MouseEvent } from 'react'

import { PRO_UPGRADE_URL } from '@/lib/tier-config'

type UpgradePromptProps = {
  featureName: string
  description: string
  variant: 'inline' | 'modal'
  onClose?: () => void
}

function UpgradePromptCard({
  featureName,
  description,
  onClose,
}: {
  featureName: string
  description: string
  onClose?: () => void
}) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(120,70,220,0.08)',
        border: '1px solid rgba(180,130,255,0.20)',
        borderRadius: 16,
        padding: 28,
      }}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade prompt"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
          }}
        >
          x
        </button>
      ) : null}

      <p
        style={{
          margin: 0,
          marginBottom: 16,
          color: 'rgba(180,130,255,0.7)',
          fontSize: 12,
          fontFamily: "'Courier New', monospace",
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        ✦ Pro feature
      </p>

      <p style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>{featureName}</p>

      <p style={{ margin: 0, marginBottom: 18, color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.55 }}>
        {description}
      </p>

      <Link
        href={PRO_UPGRADE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          textDecoration: 'none',
          background: '#FFFFFF',
          color: '#000000',
          fontWeight: 600,
          borderRadius: 10,
          padding: '14px 24px',
        }}
      >
        Upgrade to Pro - $4.99/mo
      </Link>

      <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.30)', fontSize: 12, textAlign: 'center' }}>
        Free 7-day trial. Cancel any time.
      </p>
    </div>
  )
}

export default function UpgradePrompt({ featureName, description, variant, onClose }: UpgradePromptProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (variant === 'inline') {
    return <UpgradePromptCard featureName={featureName} description={description} />
  }

  if (!mounted) return null

  const close = () => {
    onClose?.()
  }

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      close()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'rgba(5,7,16,0.72)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ width: 'min(560px, 100%)' }}>
        <UpgradePromptCard featureName={featureName} description={description} onClose={close} />
      </div>
    </div>
  )
}
