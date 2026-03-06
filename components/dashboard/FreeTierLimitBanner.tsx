'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { PRO_UPGRADE_URL } from '@/lib/tier-config'

type FreeTierLimitBannerProps = {
  totalEntries: number
}

export default function FreeTierLimitBanner({ totalEntries }: FreeTierLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const remaining = useMemo(() => Math.max(0, 30 - totalEntries), [totalEntries])

  if (dismissed || totalEntries < 25) {
    return null
  }

  return (
    <section
      style={{
        border: '1px solid rgba(245,158,11,0.45)',
        background: 'rgba(245,158,11,0.12)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 22,
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <p style={{ margin: 0, color: '#F8E7C4', fontSize: 14, lineHeight: 1.45 }}>
          You have {remaining}/30 free entries remaining. Upgrade to Pro for unlimited dreams.{' '}
          <Link href={PRO_UPGRADE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#FFE4A8' }}>
            Upgrade now
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss entry limit banner"
          style={{
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'transparent',
            color: '#F8E7C4',
            borderRadius: 8,
            fontSize: 12,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </section>
  )
}
