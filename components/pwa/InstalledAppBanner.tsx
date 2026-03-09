'use client'

import { useEffect, useState } from 'react'

const OPEN_APP_URL = 'https://www.somniavault.me/?source=banner'

function checkBrowserMode() {
  return !window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as Navigator & { standalone?: boolean }).standalone
}

export default function InstalledAppBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('somnia_browser_banner_dismissed') === 'true'
    if (dismissed) return

    const isInBrowser = checkBrowserMode()
    const hasInstalled = localStorage.getItem('somnia_installed') === 'true'

    if (isInBrowser && hasInstalled) {
      setShowBanner(true)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, background: 'rgba(20,10,40,0.95)', borderBottom: '1px solid rgba(180,130,255,0.20)', padding: '12px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontFamily: 'Georgia, serif', fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
        <p>You have Somnia installed. Open the app for the best experience.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              setShowHint(true)
              window.location.href = OPEN_APP_URL
            }}
            style={{ background: 'transparent', border: '1px solid rgba(200,160,80,0.5)', borderRadius: 4, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,160,80,0.9)', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}
          >
            Open App
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('somnia_browser_banner_dismissed', 'true')
              setShowBanner(false)
            }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: '4px 6px' }}
            aria-label="Dismiss installed app banner"
          >
            x
          </button>
        </div>
      </div>

      {showHint ? (
        <div style={{ marginTop: 8, color: 'rgba(220,205,245,0.85)', fontSize: 12 }}>
          Find the Somnia icon on your home screen and open it from there.
        </div>
      ) : null}
    </div>
  )
}
