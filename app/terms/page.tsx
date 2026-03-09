import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms | Somnia',
  description: 'Somnia terms of use.',
}

export default function TermsPage() {
  return (
    <div className="page-enter" style={{ backgroundColor: '#0A0B12', minHeight: '100vh', color: '#E8E4D9' }}>
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 40px 120px' }}>
        <h1
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(36px, 6vw, 54px)',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            marginBottom: '18px',
          }}
        >
          Terms of Use
        </h1>
        <div style={{ width: '64px', height: '1px', background: '#C9A84C', opacity: 0.75, marginBottom: '28px' }} />
        <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
          By using Somnia, you agree to use the service lawfully and keep your account credentials secure. Your data remains
          your own, and you can stop using the service at any time.
        </p>
      </main>
    </div>
  )
}