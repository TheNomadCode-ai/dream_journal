import type { ReactNode } from 'react'

export type DashboardNavItem = {
  href: string
  label: string
  icon: ReactNode
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'Journal',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
    ),
  },
  {
    href: '/notebooks',
    label: 'Notebooks',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4 4h12v16H4z" />
        <path d="M16 6h4v14h-4" />
        <path d="M8 8h4" />
      </svg>
    ),
  },
  {
    href: '/insights',
    label: 'Patterns',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.66 1.66 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.66 1.66 0 0 0-1.82-.33 1.66 1.66 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.66 1.66 0 0 0-1-1.51 1.66 1.66 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.66 1.66 0 0 0 4.6 15a1.66 1.66 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.66 1.66 0 0 0 4.6 9a1.66 1.66 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.66 1.66 0 0 0 8.92 4.6H9a1.66 1.66 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.66 1.66 0 0 0 1 1.51 1.66 1.66 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.66 1.66 0 0 0 19.4 9c.2.49.68.81 1.21.81H21a2 2 0 1 1 0 4h-.39c-.53 0-1.01.32-1.21.81Z" />
      </svg>
    ),
  },
]
