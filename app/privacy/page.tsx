import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Somnia',
  description: 'How Somnia protects your dream journal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="page-enter" style={{ backgroundColor: '#0A0B12', minHeight: '100vh', color: '#E8E4D9' }}>
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '72px 40px 120px' }}>
        <h1
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(38px, 6vw, 58px)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '22px',
          }}
        >
          Your dreams are yours. We will never sell, share or mine your data.
        </h1>

        <div style={{ width: '72px', height: '1px', background: '#C9A84C', opacity: 0.8, marginBottom: '36px' }} />

        <section style={{ display: 'grid', gap: '26px' }}>
          <article>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '11px', color: '#C9A84C', marginBottom: '10px' }}>
              Privacy Policy
            </h2>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
              Somnia is built so your journal remains private by default. This policy applies to all Somnia dream entries,
              profile settings, and account data.
            </p>
          </article>

          <article>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', color: '#E8E4D9', marginBottom: '10px' }}>
              Data storage and access controls
            </h3>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
              Dream entries and profile data are stored in Supabase (Postgres). Row Level Security (RLS) is enabled so each
              user can only read and modify their own records.
            </p>
          </article>

          <article>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', color: '#E8E4D9', marginBottom: '10px' }}>
              No tracking and no ads
            </h3>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
              Somnia does not run third-party ad trackers, behavioral ad scripts, or analytics pixels that profile your dream
              content for advertising.
            </p>
          </article>

          <article>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', color: '#E8E4D9', marginBottom: '10px' }}>
              Full export, any time
            </h3>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
              You can export your journal data whenever you choose. Your archive remains portable and available to you at all
              times.
            </p>
          </article>

          <article>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', color: '#E8E4D9', marginBottom: '10px' }}>
              No data selling or sharing
            </h3>
            <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '18px', lineHeight: 1.75, color: '#6B6F85' }}>
              We do not sell your data. We do not share your dream content with advertisers, data brokers, or third parties.
              Ever.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}