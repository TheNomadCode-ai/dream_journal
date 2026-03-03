export default function InsightsPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0B12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ marginBottom: '28px', opacity: 0.35 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1" style={{ margin: '0 auto' }}>
            <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '36px',
            color: '#E8E4D9',
            letterSpacing: '-0.01em',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          Dream Patterns
        </h1>

        {/* Divider */}
        <div
          style={{
            width: '40px',
            height: '1px',
            backgroundColor: '#C9A84C',
            margin: '0 auto 24px',
            opacity: 0.5,
          }}
        />

        {/* Description */}
        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '18px',
            color: '#6B6F85',
            lineHeight: 1.7,
            marginBottom: '12px',
          }}
        >
          Uncover recurring themes, emotions, and symbols across your dream archive.
        </p>
        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '16px',
            color: '#6B6F85',
            lineHeight: 1.7,
            marginBottom: '40px',
          }}
        >
          AI pattern analysis, mood trends, lucid dream frequency, and weekly digests — all in Pro.
        </p>

        {/* Feature list */}
        <div
          style={{
            background: '#12141F',
            border: '1px solid #1E2235',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          {[
            'Recurring symbol & theme detection',
            'Mood trend charts over time',
            'Lucid dream frequency tracker',
            'Weekly dream digest emails',
            'Unlimited entries & notebooks',
            'Full archive export',
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                borderBottom: '1px solid #1E2235',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 300,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E8E4D9',
                }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Gumroad CTA */}
        <a
          href="https://sushankhanal.gumroad.com/l/jhdln"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold"
          style={{
            display: 'inline-block',
            padding: '14px 40px',
            border: '1px solid #C9A84C',
            borderRadius: '2px',
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#E8E4D9',
          }}
        >
          Unlock Pro
        </a>

        {/* Sub-note */}
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '10px',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6B6F85',
            marginTop: '16px',
          }}
        >
          One-time purchase · Lifetime access
        </p>

      </div>
    </div>
  )
}
