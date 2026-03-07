import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'
import AlarmDemoTicker from '@/components/landing/AlarmDemoTicker'
import FounderDmLink from '@/components/landing/FounderDmLink'
import MobileNav from '@/components/landing/MobileNav'
import { createClient } from '@/lib/supabase/server'

const FEATURES = [
  {
    label: 'Alarm-Gated Capture',
    desc: 'Set a wake-up alarm. Get a 2-minute window. Miss it and the day is gone. This is the only journal that takes your dreams as seriously as you do.',
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

const GUMROAD_URL = 'https://sushankhanal.gumroad.com/l/somniavault'

const TIMELINE = [
  {
    label: 'NIGHT BEFORE',
    heading: 'Set your alarm in Somnia.',
    body: 'Pick your wake-up time. Somnia schedules the window. Your phone does the rest.',
  },
  {
    label: 'THE MOMENT YOU WAKE',
    heading: 'Notification fires. Clock starts.',
    body: 'Tap the notification. You land directly in the capture screen. The 2-minute countdown has already begun — it started the moment the alarm fired, not when you tapped.',
  },
  {
    label: 'TWO MINUTES LATER',
    heading: 'Write, or lose it forever.',
    body: "Once you type the first word, the timer disappears and you have all the time you need to finish. But if 2 minutes pass with nothing written — that day's window closes. No override. No second chance.",
  },
  {
    label: 'OVER TIME',
    heading: 'Your subconscious builds a pattern.',
    body: 'Every captured dream is indexed, tagged, and analysed. After 30 entries, Somnia shows themes your waking mind missed.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔔',
    title: 'Alarm fires',
    body: 'At your chosen time, Somnia sends a notification. Your 2-minute window opens at that exact moment.',
  },
  {
    step: '02',
    icon: '✏️',
    title: 'You write',
    body: 'Tap the notification. One screen, no navigation. Type the first word and the timer stops — you have as long as you need from there.',
  },
  {
    step: '03',
    icon: '🔒',
    title: 'Window closes',
    body: "Two minutes after the alarm, the window locks for the day. This isn't a bug. It's the point. Urgency is what makes you remember.",
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const journalHref = user ? '/dreams/new' : '/login'

  return (
    <div className="landing-page" style={{ backgroundColor: '#0A0B12', minHeight: '100vh', color: '#E8E4D9' }}>
      <ScrollReveal />

      <div aria-hidden="true" className="landing-grain" />

      {/* ── Watermark SVG ────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '46%',
          right: '-6%',
          transform: 'translateY(-50%)',
          opacity: 0.06,
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

      <MobileNav journalHref={journalHref} pricingHref={GUMROAD_URL} />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className="landing-desktop-nav"
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
            Somnia
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <Link href={journalHref} className="btn-ghost-gold" style={{ fontSize: '11px' }}>
            Journal
          </Link>
          <Link href="/privacy" className="btn-ghost-gold" style={{ fontSize: '11px' }}>
            Privacy
          </Link>
          <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost-gold" style={{ fontSize: '11px' }}>
            Pricing
          </a>
          <Link href="/login" className="btn-ghost-gold" style={{ fontSize: '11px' }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="landing-hero"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '64px 40px 86px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="animate-fade-in landing-hero-top" style={{ width: 'min(920px, 100%)', marginBottom: '46px' }}>
          <p
            className="landing-hero-eyebrow"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              fontSize: '10px',
              fontWeight: 300,
              color: '#6B6F85',
              marginBottom: '10px',
            }}
          >
            THE ONLY JOURNAL WITH A CLOSING WINDOW
          </p>
          <div style={{ height: '1px', background: '#1E2235', width: '100%' }}>
            <div className="sixty-loop-bar" style={{ height: '100%', background: '#C9A84C' }} />
          </div>
        </div>

        <h1
          className="animate-fade-up landing-hero-title"
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(58px, 9vw, 112px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#E8E4D9',
            maxWidth: '840px',
            marginBottom: '20px',
          }}
        >
          Your alarm fires.
          <br />
          The window opens.
          <br />
          Two minutes. Then it&apos;s gone.
        </h1>

        <p
          className="animate-fade-up-1 landing-hero-subtext"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '16px',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '520px',
            lineHeight: 1.65,
            marginBottom: '62px',
          }}
        >
          Somnia sets a wake-up alarm. The moment it fires, your capture window opens. Write within 2 minutes, or that dream is lost forever. No exceptions. No extensions.
        </p>

        <div className="animate-fade-up-3 landing-hero-cta-wrap" style={{ display: 'grid', placeItems: 'center' }}>
          <Link href={journalHref} className="btn-gold landing-hero-cta">
            Set Your First Alarm — it&apos;s free
          </Link>
          <p
            className="landing-hero-note"
            style={{
              marginTop: '14px',
              fontFamily: "'Josefin Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '13px',
              color: '#6B6F85',
            }}
          >
            No ads. No data selling. Your window. Your dreams.
          </p>
        </div>
      </section>

      <section
        data-reveal
        className="landing-demo-section"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 60px 64px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '10px',
            color: '#6B6F85',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          WHAT HAPPENS WHEN YOUR ALARM FIRES
        </p>
        <AlarmDemoTicker />
      </section>

      <section
        className="landing-timeline-section"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 60px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="landing-timeline"
          style={{
            width: 'min(980px, 100%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '1px',
            background: '#1E2235',
          }}
        >
          {TIMELINE.map((column) => (
            <div key={column.label} className="landing-timeline-card" style={{ background: '#0A0B12', padding: '28px 24px 32px', textAlign: 'left' }}>
              <p
                className="landing-timeline-label"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  fontSize: '10px',
                  color: '#C9A84C',
                  marginBottom: '12px',
                }}
              >
                {column.label}
              </p>
              <h3
                style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '29px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: '#E8E4D9',
                  marginBottom: '12px',
                }}
              >
                {column.heading}
              </h3>
              <p
                className="landing-timeline-body"
                style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: '17px',
                  color: '#6B6F85',
                  lineHeight: 1.7,
                }}
              >
                {column.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        data-reveal
        className="landing-how-section"
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          padding: '0 60px 92px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
            textAlign: 'center',
            marginBottom: '34px',
          }}
        >
          How the window works
        </p>

        <div className="landing-how-grid">
          <div className="landing-how-line" aria-hidden="true" />
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="landing-how-card">
              <span className="landing-how-step-number" aria-hidden="true">{item.step}</span>
              <p className="landing-how-icon" aria-hidden="true">{item.icon}</p>
              <h3 className="landing-how-title">{item.title}</h3>
              <p className="landing-how-body">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <div
        data-reveal
        style={{
          width: '1px',
          height: '72px',
          background: 'linear-gradient(to bottom, transparent, #1E2235, transparent)',
          margin: '0 auto',
        }}
      />

      <section
        className="landing-features-section"
        style={{
          maxWidth: '960px',
          margin: '80px auto',
          padding: '0 60px 120px',
          position: 'relative',
          zIndex: 1,
        }}
      >
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
          What Somnia offers
        </p>

        <div
          className="landing-features-grid"
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
              className="landing-feature-card"
              data-reveal
              data-delay={String(i * 100)}
              style={{
                background: '#0A0B12',
                padding: '40px 36px',
              }}
            >
              <div
                className="landing-feature-icon"
                style={{
                  width: '28px',
                  height: '1px',
                  background: '#C9A84C',
                  opacity: 0.6,
                  marginBottom: '22px',
                }}
              />
              <h3
                className="landing-feature-title"
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
                className="landing-feature-desc"
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

      <section
        data-reveal
        className="landing-social-proof"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 60px 88px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="landing-social-inner">
          <p className="landing-social-mark" aria-hidden="true">&quot;</p>
          <p className="landing-social-copy">
            Most people have never successfully written down a dream. Not because they don't want to — because by the time they find an app and open it, it's gone. Somnia is built around that one biological fact.
          </p>
          <p className="landing-social-attribution">— Somnia, on why the window exists</p>

          <div className="landing-social-stats">
            {[
              { value: '60s', label: 'avg dream fade time' },
              { value: '2 min', label: 'your capture window' },
              { value: 'Day 30', label: 'patterns emerge' },
            ].map((stat) => (
              <div key={stat.value} className="landing-social-stat">
                <p className="landing-social-stat-value">{stat.value}</p>
                <p className="landing-social-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        data-reveal
        className="landing-values-section"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 60px 90px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            fontSize: '10px',
            fontWeight: 300,
            color: '#6B6F85',
            textAlign: 'center',
            marginBottom: '34px',
          }}
        >
          How we protect your data
        </p>

        <div style={{ display: 'grid', gap: '14px' }}>
          {[
            'Timed capture is strict by design, because urgency improves recall in sleep science studies.',
            'A journal that reflects your patterns over time, not just isolated entries.',
            'Your dreams are private data. No ads, no tracking, and no data selling.',
          ].map((line) => (
            <div
              key={line}
              style={{
                border: '1px solid #1E2235',
                background: '#12141F',
                padding: '22px 24px',
              }}
            >
              <p
                style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: '18px',
                  color: '#E8E4D9',
                  lineHeight: 1.7,
                  letterSpacing: '-0.005em',
                }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        data-reveal
        className="landing-founder-section"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 60px 90px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="landing-founder-card"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '32px 36px',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            From the founder
          </p>
          <p
            style={{
              fontStyle: 'italic',
              fontSize: '17px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '20px',
            }}
          >
            &quot;Built by a solo founder who kept forgetting his dreams.
            <br />
            <br />
            If you have questions, feedback, or just want to talk about dreams — my DMs are open.&quot;
          </p>
          <FounderDmLink showIcon />
        </div>
      </section>

      <section
        data-reveal
        className="landing-final-cta"
        style={{
          textAlign: 'center',
          padding: '80px 40px 120px',
          borderTop: '1px solid #1E2235',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h2
          className="landing-final-title"
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
          Tonight you will dream.
        </h2>
        <p
          className="landing-final-desc"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '17px',
            color: '#6B6F85',
            marginBottom: '34px',
            maxWidth: '620px',
            marginInline: 'auto',
            lineHeight: 1.7,
          }}
        >
          Set your alarm now. Tomorrow morning, the window opens. Everything after that depends on whether you're ready.
        </p>
        <Link href="/login" className="btn-gold">
          Set My First Alarm — it&apos;s free
        </Link>
        <p
          style={{
            marginTop: '14px',
            fontFamily: "'Josefin Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.40)',
          }}
        >
          No ads. No data selling. No credit card. Cancel any time.
        </p>
      </section>

      <footer
        className="landing-footer"
        style={{
          borderTop: '1px solid #1E2235',
          padding: '32px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          className="landing-footer-meta"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span
            className="landing-footer-copyright"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontSize: '10px',
              fontWeight: 300,
              color: '#6B6F85',
            }}
          >
            © 2026 Somnia
          </span>
          <p
            className="landing-footer-founder"
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.30)',
              textAlign: 'left',
            }}
          >
            Built by a solo founder who kept forgetting his dreams — DM{' '}
            <FounderDmLink
              color="rgba(255,255,255,0.30)"
              hoverColor="rgba(255,255,255,0.70)"
              fontSize="13px"
            />{' '}
            on X
          </p>
        </div>
        <div className="landing-footer-links" style={{ display: 'flex', gap: '28px' }}>
          <Link href="/privacy" className="btn-ghost-gold" style={{ fontSize: '10px' }}>
            Privacy Policy
          </Link>
          {['Terms', 'Export Data'].map((l) => (
            <span key={l} className="btn-ghost-gold" style={{ fontSize: '10px' }}>
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
