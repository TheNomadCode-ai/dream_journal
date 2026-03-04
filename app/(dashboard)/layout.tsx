import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import PushOnboarding from '@/components/push/PushOnboarding'

// Moon phase glyphs cycling by week
const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

function getMoonPhase() {
  const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 3.7)) % 8
  return MOON_PHASES[week]
}

const NAV_ITEMS = [
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
    href: '/insights',
    label: 'Patterns',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
      </svg>
    ),
  },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('wake_time, wake_timezone, push_enabled')
    .eq('id', user.id)
    .single()

  const initials = (user.email ?? 'D').slice(0, 2).toUpperCase()
  const moon = getMoonPhase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0B12' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar">

        {/* Logo */}
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

        {/* Avatar */}
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
                {user.email?.split('@')[0]}
              </p>
              <a
                href="https://sushankhanal.gumroad.com/l/jhdln"
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

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <span style={{ opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: moon phase */}
        <div style={{ borderTop: '1px solid #1E2235', padding: '12px 0 0' }}>
          {/* Moon phase indicator */}
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

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 40px' }}>
          <PushOnboarding
            wakeTime={profile?.wake_time ?? null}
            wakeTimezone={profile?.wake_timezone ?? 'UTC'}
            pushEnabled={profile?.push_enabled ?? false}
          />
        </div>
        {children}
      </main>
    </div>
  )
}
