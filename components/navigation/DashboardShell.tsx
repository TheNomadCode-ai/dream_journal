'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'
import NotificationWarningBadge from '@/components/navigation/NotificationWarningBadge'

type DashboardShellProps = {
  userId: string
  userEmail: string
  initials: string
  isPro: boolean
  isTrialing: boolean
  children: React.ReactNode
}

export default function DashboardShell({ userId, userEmail, initials, isPro, isTrialing, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hasSidebarHistoryEntry = useRef(false)
  const closeFromHistoryBack = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')

    const syncIsMobile = () => {
      const mobile = mediaQuery.matches
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
        hasSidebarHistoryEntry.current = false
      }
    }

    syncIsMobile()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncIsMobile)
      return () => mediaQuery.removeEventListener('change', syncIsMobile)
    }

    mediaQuery.addListener(syncIsMobile)
    return () => mediaQuery.removeListener(syncIsMobile)
  }, [])

  const closeDrawer = useCallback((syncHistory = true) => {
    setSidebarOpen(false)
    if (isMobile && hasSidebarHistoryEntry.current && syncHistory) {
      closeFromHistoryBack.current = true
      hasSidebarHistoryEntry.current = false
      window.history.back()
    } else if (isMobile && hasSidebarHistoryEntry.current && !syncHistory) {
      hasSidebarHistoryEntry.current = false
    }
  }, [isMobile])

  const openDrawer = useCallback(() => {
    if (!isMobile) return
    setSidebarOpen(true)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile || !sidebarOpen || hasSidebarHistoryEntry.current) return

    window.history.pushState({ dashboardDrawer: true }, '')
    hasSidebarHistoryEntry.current = true
  }, [isMobile, sidebarOpen])

  useEffect(() => {
    const onPopState = () => {
      if (closeFromHistoryBack.current) {
        closeFromHistoryBack.current = false
        return
      }

      if (isMobile && sidebarOpen) {
        hasSidebarHistoryEntry.current = false
        setSidebarOpen(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [isMobile, sidebarOpen])

  return (
    <div className="dashboard-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0B12' }}>
      <NotificationWarningBadge userId={userId} />

      {!(isMobile && sidebarOpen) && (
        <button
          type="button"
          onClick={() => openDrawer()}
          aria-label="Open navigation menu"
          className="dashboard-mobile-menu-btn"
        >
          <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{'≡'}</span>
        </button>
      )}

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => closeDrawer()}
        className={`dashboard-mobile-overlay${sidebarOpen ? ' open' : ''}`}
      />

      <aside className={`sidebar${sidebarOpen ? ' sidebar-mobile-open' : ''}`} style={{ overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '20px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Somnia
          </div>
          {isMobile && sidebarOpen ? (
            <button
              type="button"
              onClick={() => closeDrawer()}
              aria-label="Close navigation menu"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 6,
                width: 30,
                height: 30,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1,
              }}
            >
              X
            </button>
          ) : null}
        </div>

        <div style={{ padding: '20px 22px', borderBottom: '1px solid #1E2235' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #1E2235', background: '#12141F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.1em', color: '#C9A84C' }}>
              {initials}
            </div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', color: '#E8E4D9' }}>
              {userEmail}
            </p>
          </div>
        </div>

        <nav style={{ padding: '12px 0' }}>
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${pathname === item.href ? ' active' : ''}`}
              onClick={() => {
                if (isMobile) closeDrawer(false)
              }}
            >
              <span style={{ opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            margin: '24px 16px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Your Plan
          </div>

          {isPro ? (
            <>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  color: 'rgba(200,160,80,0.9)',
                  marginBottom: '8px',
                }}
              >
                Pro
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  lineHeight: 1.8,
                }}
              >
                {'✓ Morning capture'}<br />
                {'✓ Dream journal'}<br />
                {'✓ Search'}<br />
                {'✓ Seed planting'}<br />
                {'✓ Streak tracking'}<br />
                {'✓ Success rate'}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '8px',
                }}
              >
                Free
                {isTrialing && (
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      color: 'rgba(200,160,80,0.6)',
                      marginLeft: '8px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    PRO TRIAL
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  lineHeight: 1.8,
                  marginBottom: '12px',
                }}
              >
                {'✓ Morning capture'}<br />
                {'✓ Dream journal'}<br />
                {'✓ Search'}<br />
                {'— Seed planting (Pro)'}<br />
                {'— Streak tracking (Pro)'}<br />
                {'— Success rate (Pro)'}
              </div>
              <a
                href="https://sushankhanal.gumroad.com/l/somniavault"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  border: '1px solid rgba(200,160,80,0.4)',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  color: 'rgba(200,160,80,0.8)',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                {'Upgrade to Pro ->'}
              </a>
            </>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a
            href="https://twitter.com/messages/compose?recipient_id=sirberialo007"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            {'Contact founder ->'}
          </a>
        </div>

        <div style={{ borderTop: '1px solid #1E2235', padding: '14px 22px 20px' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '9px', color: '#6B6F85' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </aside>

      <main className="dashboard-main" style={{ flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
