import type { Metadata } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Somnia - Dream Programming Practice',
  description: 'Plant a dream intention every evening and confirm what happened every morning.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div style={{ minHeight: '100vh', background: '#06040f', color: '#f1e9ff' }}>
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '56px 24px 74px', textAlign: 'center' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: '#9f8abb', marginBottom: 18 }}>Somnia</p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(48px,8vw,82px)', lineHeight: 1.04, marginBottom: 18 }}>
          You spend a third of your life asleep.
          <br />
          Most of it disappears by morning.
        </h1>
        <p style={{ maxWidth: 480, margin: '0 auto 24px', color: '#baa7d8', lineHeight: 1.7 }}>
          Somnia is a dream programming practice.
          Plant an intention every evening.
          Find out what your subconscious does with it by morning.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">Start for free</Link>
          <a href="#how-it-works" className="btn-ghost-gold">See how it works</a>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.14)', marginTop: 38 }} />
      </section>

      <section id="how-it-works" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 90px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: '#9f8abb', marginBottom: 16 }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {[
            {
              number: '01',
              title: 'Plant',
              body: 'Each evening a 5 minute window opens. Write what you want your subconscious to process tonight. A memory. A question. A person. Close the app and sleep.',
            },
            {
              number: '02',
              title: 'Sleep',
              body: 'Your subconscious works through the night. Dream incubation is documented in sleep research going back decades. Your brain is more programmable than you think.',
            },
            {
              number: '03',
              title: 'Confirm',
              body: 'A window opens when you wake. Did your intention appear? Write what you remember. Your archive builds. Patterns emerge over time.',
            },
          ].map((item) => (
            <article key={item.number} style={{ border: '1px solid rgba(180,130,255,0.22)', borderRadius: 14, background: '#100a22', padding: 18 }}>
              <p style={{ color: '#9f8abb', fontSize: 12, marginBottom: 8 }}>{item.number}</p>
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, marginBottom: 8 }}>{item.title}</h2>
              <p style={{ color: '#c2b0df', lineHeight: 1.7 }}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 90px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: '#9f8abb', marginBottom: 12 }}>The science</p>
          <p style={{ color: '#c2b0df', lineHeight: 1.75 }}>
            During REM sleep your brain replays and processes information from waking life. Thoughts held with intention before sleep are more likely to be processed during this phase.
            <br /><br />
            This is called dream incubation. It has been documented since Aristotle, studied in sleep labs at Harvard and MIT, and practiced by figures from Edison to Salvador Dali.
            <br /><br />
            Somnia is the first app built around this practice.
          </p>
        </div>
        <aside style={{ border: '1px solid rgba(180,130,255,0.22)', borderRadius: 14, background: '#100a22', padding: 20, alignSelf: 'stretch' }}>
          <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, lineHeight: 1.25, marginBottom: 14 }}>
            The investigation of the truth is in one way hard, in another easy. No one is able to attain it adequately, while on the other hand we do not collectively fail.
          </p>
          <p style={{ color: '#aa95cd' }}>- Aristotle, on dreams, 350 BC</p>
        </aside>
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 90px', textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 42 }}>
          <div><p style={{ fontSize: 40 }}>5</p><p style={{ color: '#aa95cd' }}>minutes to plant</p></div>
          <div><p style={{ fontSize: 40 }}>30%</p><p style={{ color: '#aa95cd' }}>of seeds dreamed</p></div>
          <div><p style={{ fontSize: 40 }}>8 hours</p><p style={{ color: '#aa95cd' }}>every night your brain works</p></div>
        </div>

        <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 54, marginBottom: 10 }}>Your subconscious has been waiting.</h2>
        <p style={{ color: '#baa7d8', marginBottom: 14 }}>Free to start. No card required.</p>
        <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">Begin tonight</Link>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 24px 30px', display: 'flex', justifyContent: 'space-between', color: '#9f8abb', gap: 14, flexWrap: 'wrap' }}>
          <p>Somnia</p>
          <p><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/blog">Blog</Link></p>
          <p>somniavault.me</p>
        </div>
      </footer>
    </div>
  )
}
