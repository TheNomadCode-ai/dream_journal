'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'

type DashboardShellProps = {
  userEmail: string
  initials: string
  moon: string
  homeScreenInstalled: boolean
  children: React.ReactNode
}

export default function DashboardShell({
  userEmail,
  initials,
  moon,
  homeScreenInstalled,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const hasSidebarHistoryEntry = useRef(false)
  const closeFromHistoryBack = useRef(false)

  useEffect(() => {
    const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standaloneMatch || iosStandalone)
  }, [])

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

  const toggleSidebar = useCallback(() => {
    if (!isMobile) return
    if (sidebarOpen) {
      closeDrawer()
      return
    }
    openDrawer()
  }, [closeDrawer, isMobile, openDrawer, sidebarOpen])

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

  const onNavClick = () => {
    if (isMobile) closeDrawer(false)
  }

  const showInstallBanner = useMemo(() => !homeScreenInstalled && !isStandalone, [homeScreenInstalled, isStandalone])

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!isMobile || !sidebarOpen || touchStartX === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX
    const deltaX = endX - touchStartX

    if (deltaX < -50) {
      closeDrawer()
    }

    setTouchStartX(null)
  }

  return (
    <div className="dashboard-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0B12' }}>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="dashboard-mobile-menu-btn"
      >
        <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => closeDrawer()}
        className={`dashboard-mobile-overlay${sidebarOpen ? ' open' : ''}`}
      />

      <aside
        className={`sidebar${sidebarOpen ? ' sidebar-mobile-open' : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div style={{ padding: '28px 22px 20px', borderBottom: '1px solid #1E2235' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke="#C9A84C"
                strokeWidth="1.2"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '20px',
                color: '#E8E4D9',
                letterSpacing: '-0.01em',
              }}
            >
              Somnia
            </span>
          </div>
        </div>

        <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid #1E2235' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid #1E2235',
                background: '#12141F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontFamily: "'Josefin Sans', sans-serif",
                letterSpacing: '0.1em',
                color: '#C9A84C',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '10px',
                  fontWeight: 300,
                  color: '#E8E4D9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userEmail}
              </p>
              <a
                href="https://sushankhanal.gumroad.com/l/somniavault"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '9px',
                  fontWeight: 300,
                  color: '#C9A84C',
                  marginTop: '2px',
                  display: 'block',
                  textDecoration: 'none',
                }}
              >
                Upgrade to Pro →
              </a>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${pathname === item.href ? ' active' : ''}`}
              onClick={onNavClick}
            >
              <span style={{ opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #1E2235', padding: '12px 0 0' }}>
          <div
            style={{
              padding: '14px 22px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '16px', opacity: 0.75 }}>{moon}</span>
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '9px',
                fontWeight: 300,
                color: '#6B6F85',
              }}
            >
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </aside>

      <main
        className="dashboard-main"
        style={{
          flex: 1,
          minHeight: '100vh',
        }}
      >
        {showInstallBanner ? (
          <div style={{ maxWidth: '720px', margin: '16px auto 0', padding: '0 40px' }}>
            <Link
              href="/install"
              style={{ display: 'block', border: '1px solid rgba(180,130,255,0.38)', background: 'rgba(180,130,255,0.1)', color: '#f0e7ff', padding: '12px 14px', borderRadius: 10 }}
            >
              🌙 Add Somnia to your home screen for morning notifications →
            </Link>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  )
}
