'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'

type DashboardShellProps = {
  userEmail: string
  initials: string
  children: React.ReactNode
}

export default function DashboardShell({ userEmail, initials, children }: DashboardShellProps) {
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
      <button
        type="button"
        onClick={() => (sidebarOpen ? closeDrawer() : openDrawer())}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="dashboard-mobile-menu-btn"
      >
        <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{sidebarOpen ? 'X' : '≡'}</span>
      </button>

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => closeDrawer()}
        className={`dashboard-mobile-overlay${sidebarOpen ? ' open' : ''}`}
      />

      <aside className={`sidebar${sidebarOpen ? ' sidebar-mobile-open' : ''}`}>
        <div style={{ padding: '28px 22px 20px', borderBottom: '1px solid #1E2235' }}>
          <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontWeight: 300, fontSize: '20px', color: '#E8E4D9' }}>
            Somnia
          </p>
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

        <nav style={{ flex: 1, padding: '12px 0' }}>
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
