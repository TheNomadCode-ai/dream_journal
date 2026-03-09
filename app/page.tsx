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
    <div className="page-enter" style={{ minHeight: '100vh', background: '#06040f', color: '#f1e9ff' }}>
      <section style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '64px 24px' }}>
        <div style={{ maxWidth: 640, textAlign: 'center' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, color: '#9f8abb', marginBottom: 18 }}>Somnia</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(52px,9vw,86px)', lineHeight: 1.03, marginBottom: 18 }}>
            What if you could choose
            <br />
            what to dream about?
          </h1>
          <p style={{ maxWidth: 480, margin: '0 auto 26px', color: '#baa7d8', lineHeight: 1.75 }}>
            Every evening you plant an intention.
            Every morning you find out what your subconscious did with it overnight.
            Ancient technique. Personal archive.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">Start for free</Link>
            <a href="#how-it-works" style={{ color: '#9f8abb', alignSelf: 'center' }}>How it works ↓</a>
          </div>
          <p
            style={{
              color: '#d9c8f2',
              fontFamily: "'Cormorant', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(22px,3.2vw,30px)',
              lineHeight: 1.25,
              maxWidth: 520,
              margin: '8px auto 0',
            }}
          >
            No notifications. No reminders.
            <br />
            Just rhythm.
          </p>

          <p style={{ color: '#9f8abb', fontSize: 13, maxWidth: 520, margin: '18px auto 0', lineHeight: 1.6 }}>
            Your dreams are stored on your device.
            <br />
            Not our servers. Not anywhere else.
            <br />
            Yours forever.
          </p>
        </div>
      </section>

      <section id="how-it-works" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 90px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: '#9f8abb', marginBottom: 16 }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {[
            {
              number: '01',
              title: 'Plant',
              body: 'Each evening a 10 minute window opens. Write what you want your subconscious to process tonight. A memory. A question. A person. Close the app and sleep.',
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
            This is called dream incubation. It has been documented since Aristotle, studied in sleep research at Harvard and MIT, and practiced by figures from Edison to Salvador Dali.
            <br /><br />
            Somnia is the first app built entirely around this practice.
          </p>
        </div>
        <aside style={{ border: '1px solid rgba(180,130,255,0.22)', borderRadius: 14, background: '#100a22', padding: 20, alignSelf: 'stretch' }}>
          <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, lineHeight: 1.25, marginBottom: 14 }}>
            A dream which is not interpreted is like a letter which is not read.
          </p>
          <p style={{ color: '#aa95cd' }}>— The Talmud</p>
        </aside>
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 90px', textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 42 }}>
          <div><p style={{ fontSize: 40 }}>10</p><p style={{ color: '#aa95cd' }}>minutes<br />to plant</p></div>
          <div><p style={{ fontSize: 40 }}>8 hrs</p><p style={{ color: '#aa95cd' }}>every night<br />your brain is working</p></div>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 90px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 10, color: '#9f8abb', marginBottom: 16, textAlign: 'center' }}>Pricing</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <article style={{ border: '1px solid rgba(180,130,255,0.22)', borderRadius: 14, background: '#100a22', padding: 18 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9f8abb', fontSize: 11, marginBottom: 6 }}>Free</p>
            <p style={{ fontSize: 28, marginBottom: 10 }}>$0 forever</p>
            <p style={{ color: '#bca7de', fontSize: 12, marginBottom: 10 }}>🔒 Dreams stored locally only</p>
            <ul style={{ color: '#c2b0df', lineHeight: 1.8, marginBottom: 12, paddingLeft: 16 }}>
              <li>Dream journal</li>
              <li>Morning capture window</li>
              <li>Dream archive</li>
              <li>Streak tracking</li>
              <li>Search your dreams</li>
            </ul>
            <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">Start free →</Link>
          </article>

          <article style={{ border: '1px solid rgba(200,160,80,0.35)', borderRadius: 14, background: '#100a22', padding: 18 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#c9a84c', fontSize: 11, marginBottom: 6 }}>Pro</p>
            <p style={{ fontSize: 28, marginBottom: 2 }}>$4.99 / month</p>
            <p style={{ color: '#aa95cd', fontSize: 12, marginBottom: 10 }}>First 7 days free</p>
            <p style={{ color: '#d6c57f', fontSize: 12, marginBottom: 10 }}>🔒 Dreams stored locally only</p>
            <ul style={{ color: '#c2b0df', lineHeight: 1.8, marginBottom: 12, paddingLeft: 16 }}>
              <li>Everything in free</li>
              <li>Evening seed planting</li>
              <li>Seed success tracking</li>
              <li>Dream pattern insights</li>
            </ul>
            <a href="https://sushankhanal.gumroad.com/l/somniavault?wanted=true" target="_blank" rel="noreferrer" className="btn-gold">Start free trial →</a>
            <p style={{ color: '#8f84a7', marginTop: 8, fontSize: 12 }}>Cancel anytime. No questions asked.</p>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', color: '#e8e4d9', marginBottom: 8 }}>
          Built by a solo founder obsessed with the science of dreams.
        </p>
        <p style={{ color: '#9f8abb', marginBottom: 10 }}>
          Questions, feedback, or just want to talk about dreams -
        </p>
        <a
          href="https://twitter.com/messages/compose?recipient_id=sirberialo007"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#c9a84c' }}
        >
          {'reach out on X ->'}
        </a>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 24px 30px', display: 'flex', justifyContent: 'space-between', color: '#9f8abb', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
          <p>Somnia</p>
          <p><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/blog">Blog</Link></p>
          <p>somniavault.me</p>
        </div>
      </footer>
    </div>
  )
}
