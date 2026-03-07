'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PushOnboarding from '@/components/push/PushOnboarding'
import { DASHBOARD_NAV_ITEMS } from '@/components/navigation/nav-items'

type DashboardShellProps = {
  userEmail: string
  initials: string
  moon: string
  wakeTime: string | null
  wakeTimezone: string
  pushEnabled: boolean
  children: React.ReactNode
}

export default function DashboardShell({
  userEmail,
  initials,
  moon,
  wakeTime,
  wakeTimezone,
  pushEnabled,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const hasSidebarHistoryEntry = useRef(false)
  const closeFromHistoryBack = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')

    const syncIsMobile = () => {
      const mobile = mediaQuery.matches
      setIsMobile(mobile)
      if (!mobile) {
        setIsOpen(false)
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
    setIsOpen(false)
    if (isMobile && hasSidebarHistoryEntry.current && syncHistory) {
      closeFromHistoryBack.current = true
      hasSidebarHistoryEntry.current = false
      window.history.back()
    } else if (isMobile && hasSidebarHistoryEntry.current && !syncHistory) {
      hasSidebarHistoryEntry.current = false
    }
  }, [isMobile])

  const openDrawer = useCallback(() => {
    setIsOpen(true)
  }, [])

  useEffect(() => {
    if (!isMobile || !isOpen || hasSidebarHistoryEntry.current) return

    window.history.pushState({ dashboardDrawer: true }, '')
    hasSidebarHistoryEntry.current = true
  }, [isMobile, isOpen])

  useEffect(() => {
    const onPopState = () => {
      if (closeFromHistoryBack.current) {
        closeFromHistoryBack.current = false
        return
      }

      if (isMobile && isOpen) {
        hasSidebarHistoryEntry.current = false
        setIsOpen(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [isMobile, isOpen])

  const onNavClick = () => {
    if (isMobile) closeDrawer(false)
  }

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!isMobile || !isOpen || touchStartX === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX
    const deltaX = endX - touchStartX

    if (deltaX < -50) {
      closeDrawer()
    }

    setTouchStartX(null)
  }

  const drawerTransform = isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0B12' }}>
      {isMobile && (
        <>
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Open navigation menu"
            style={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 90,
              width: 44,
              height: 44,
              border: '1px solid #1E2235',
              background: 'rgba(13,14,24,0.96)',
              color: '#E8E4D9',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>≡</span>
          </button>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => closeDrawer()}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 69,
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? 'auto' : 'none',
              transition: 'opacity 220ms ease',
              border: 'none',
              padding: 0,
            }}
          />
        </>
      )}

      <aside
        className="sidebar"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          transform: drawerTransform,
          transition: isMobile ? 'transform 240ms ease' : undefined,
          zIndex: isMobile ? 70 : 40,
        }}
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
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : '220px',
          minHeight: '100vh',
          paddingTop: isMobile ? 72 : 0,
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 40px' }}>
          <PushOnboarding
            wakeTime={wakeTime}
            wakeTimezone={wakeTimezone}
            pushEnabled={pushEnabled}
          />
        </div>
        {children}
      </main>
    </div>
  )
}
