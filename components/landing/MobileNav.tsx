'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type MobileNavProps = {
  journalHref: string
  pricingHref: string
}

export default function MobileNav({ journalHref, pricingHref }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav className="landing-mobile-nav" aria-label="Mobile navigation">
        <div className="landing-mobile-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="#C9A84C"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Somnia</span>
        </div>

        <button
          type="button"
          className="landing-mobile-menu-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div
        id="landing-mobile-menu"
        className={`landing-mobile-overlay ${open ? 'open' : ''}`}
        aria-hidden={!open}
      >
        <div className="landing-mobile-overlay-panel">
          <div className="landing-mobile-links">
            <Link href={journalHref} className="landing-mobile-link" onClick={() => setOpen(false)}>
              Journal
            </Link>
            <Link href="/privacy" className="landing-mobile-link" onClick={() => setOpen(false)}>
              Privacy
            </Link>
            <a
              href={pricingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-mobile-link"
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
          </div>

          <Link href="/login" className="landing-mobile-signin" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </div>
      </div>
    </>
  )
}
