import type { Metadata } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Train your body to wake up without an alarm.',
  description:
    'Somnia tracks your natural wake patterns every morning. Within 30 days most users wake within 10 minutes of their target naturally.',
  alternates: {
    canonical: 'https://somniavault.me',
  },
}

const HOW_IT_WORKS = [
  {
    icon: '🎯',
    title: 'Set your target',
    body: 'Tell Somnia when you want to wake up. Not an alarm, a goal for your body to learn.',
  },
  {
    icon: '☀️',
    title: 'Log every morning',
    body: "Open the app when you wake. Log your time and capture last night's dream. Takes 2 minutes.",
  },
  {
    icon: '📈',
    title: 'Watch your clock train',
    body: 'Your biological clock score improves daily. Most users hit their target naturally within 30 days.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Somnia',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'Wake up naturally without an alarm. Somnia tracks your morning patterns, records your dreams, and trains your biological clock in 30 days.',
  url: 'https://somniavault.me',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const userCount = count ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%, rgba(124,84,210,0.22), #06040f 50%)', color: '#f3edff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '42px 24px 90px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 24 }}>🌙 Somnia</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/blog" className="btn-ghost-gold">Blog</Link>
            <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">{user ? 'Open app' : 'Start free'}</Link>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(52px,9vw,94px)', lineHeight: 1.04, marginBottom: 14 }}>
          Train your body to wake up
          <br />
          without an alarm.
        </h1>

        <p style={{ maxWidth: 700, fontSize: 22, lineHeight: 1.5, color: '#d7c5f1', marginBottom: 22 }}>
          Somnia tracks your natural wake patterns every morning. Within 30 days most users wake within 10 minutes of their target naturally.
        </p>

        <p style={{ color: '#ceb5f1', marginBottom: 34 }}>
          Join {userCount} early users training their biological clock
        </p>

        <Link href={user ? '/dashboard' : '/signup'} className="btn-gold">Begin Training →</Link>
      </section>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 100px' }}>
        <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 10, color: '#b69adf', marginBottom: 16 }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {HOW_IT_WORKS.map((item) => (
            <article key={item.title} style={{ border: '1px solid rgba(180,130,255,0.25)', borderRadius: 14, background: 'rgba(15,10,33,0.78)', padding: 18 }}>
              <p style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</p>
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 34, marginBottom: 8 }}>{item.title}</h2>
              <p style={{ color: '#ccb8e8', lineHeight: 1.65 }}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
