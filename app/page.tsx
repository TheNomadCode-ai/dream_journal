import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'

const FEATURES = [
  {
    label: 'Total Recall',
    desc: 'Optimised for the 60-second window after waking. Open, speak or type before the images dissolve.',
  },
  {
    label: 'Pattern Sight',
    desc: 'AI surfaces recurring symbols, figures, and emotional threads across months of entries.',
  },
  {
    label: 'Sovereign Data',
    desc: 'No advertisements. No resale. No cloud lock-in. Export your full archive any time.',
  },
  {
    label: 'Full-Text Search',
    desc: 'Retrieve any dream by symbol, character, or phrase. Every word is indexed.',
  },
  {
    label: 'Ritual Structure',
    desc: 'Notebooks, tags, lucidity tracking, and mood scoring — organised the way your subconscious works.',
  },
  {
    label: 'Absolute Privacy',
    desc: 'Row-level security and encrypted transport from the first keystroke. Your interior world is yours.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#0A0B12', minHeight: '100vh', color: '#E8E4D9' }}>
      <ScrollReveal />

      {/* ── Watermark SVG ────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '50%',
          right: '-8%',
          transform: 'translateY(-50%)',
          opacity: 0.055,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
          {[60, 110, 160, 210, 255].map((r) => (
            <circle key={r} cx="260" cy="260" r={r} stroke="#C9A84C" strokeWidth="0.75" />
          ))}
          {/* Crescent */}
          <path
            d="M260 60 C180 80 140 170 160 260 C140 350 180 440 260 460 C170 440 100 360 100 260 C100 160 170 80 260 60Z"
            fill="#C9A84C"
          />
        </svg>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 60px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="#C9A84C"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '22px',
              color: '#E8E4D9',
              letterSpacing: '-0.01em',
            }}
          >
            DreamLog
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {['Journal', 'Privacy', 'Pricing'].map((label) => (
            <span key={label} className="btn-ghost-gold" style={{ fontSize: '11px' }}>
              {label}
            </span>
          ))}
          <Link href="/login" className="btn-ghost-gold" style={{ fontSize: '11px' }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '100px 40px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Eyebrow */}
        <p
          className="animate-fade-in"
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
            marginBottom: '36px',
          }}
        >
          Dream Journal · Est. 2026
        </p>

        {/* Headline */}
        <h1
          className="animate-fade-up"
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(54px, 8vw, 88px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#E8E4D9',
            maxWidth: '840px',
            marginBottom: '20px',
          }}
        >
          Your dreams,<br />remembered.
        </h1>

        {/* Gold underline */}
        <div
          className="animate-fade-up-1"
          style={{
            width: '80px',
            height: '1px',
            background: '#C9A84C',
            opacity: 0.8,
            marginBottom: '36px',
          }}
        />

        {/* Subhead */}
        <p
          className="animate-fade-up-2"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '19px',
            color: '#6B6F85',
            maxWidth: '460px',
            lineHeight: 1.65,
            marginBottom: '52px',
          }}
        >
          A private dream journal that learns the language of your subconscious.
          Your entries remain yours — always.
        </p>

        {/* CTA */}
        <div className="animate-fade-up-3">
          <Link href="/signup" className="btn-gold">
            Begin your journal
          </Link>
        </div>
      </section>

      {/* ── Thin divider ─────────────────────────────────────── */}
      <div
        data-reveal
        style={{
          width: '1px',
          height: '72px',
          background: 'linear-gradient(to bottom, transparent, #1E2235, transparent)',
          margin: '0 auto',
        }}
      />

      {/* ── Feature grid ─────────────────────────────────────── */}
      <section
        style={{
          maxWidth: '960px',
          margin: '80px auto',
          padding: '0 60px 120px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section label */}
        <p
          data-reveal
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          What DreamLog offers
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: '#1E2235',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              data-reveal
              data-delay={String(i * 100)}
              style={{
                background: '#0A0B12',
                padding: '40px 36px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '1px',
                  background: '#C9A84C',
                  opacity: 0.6,
                  marginBottom: '22px',
                }}
              />
              <h3
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#E8E4D9',
                  marginBottom: '14px',
                }}
              >
                {f.label}
              </h3>
              <p
                style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: '16px',
                  color: '#6B6F85',
                  lineHeight: 1.65,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section
        data-reveal
        style={{
          textAlign: 'center',
          padding: '80px 40px 120px',
          borderTop: '1px solid #1E2235',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(36px, 5vw, 52px)',
            color: '#E8E4D9',
            letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}
        >
          The night is waiting.
        </h2>
        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '17px',
            color: '#6B6F85',
            marginBottom: '44px',
          }}
        >
          Free to start. No credit card. Your data, always yours.
        </p>
        <Link href="/signup" className="btn-gold">
          Create your journal
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid #1E2235',
          padding: '32px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
          }}
        >
          © 2026 DreamLog
        </span>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Privacy', 'Terms', 'Export Data'].map((l) => (
            <span key={l} className="btn-ghost-gold" style={{ fontSize: '10px' }}>
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
