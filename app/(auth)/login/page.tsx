'use client'

import { Suspense, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { getAppUrl } from '@/lib/app-url'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom') ?? '/dashboard'

  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const supabase = createClient()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectedFrom)
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const appUrl = getAppUrl()
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : appUrl

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${redirectedFrom}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <div className="mb-4 text-4xl">✉️</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Check your email</h2>
        <p className="text-muted-foreground">
          We sent a login link to <strong className="text-foreground">{email}</strong>.
          <br />
          Click the link in the email to sign in.
        </p>
        <button
          onClick={() => setMagicLinkSent(false)}
          className="btn-ghost mt-6 text-sm"
        >
          ← Back to login
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="auth-heading text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="auth-subheading mt-1 text-sm text-muted-foreground">Sign in to your Somnia account</p>
      </div>

      {/* Mode toggle */}
      <div className="auth-toggle mb-6 flex rounded-lg border border-surface-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`auth-toggle-button flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            mode === 'password'
              ? 'auth-toggle-active bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={mode === 'password'}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMode('magic-link')}
          className={`auth-toggle-button flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            mode === 'magic-link'
              ? 'auth-toggle-active bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={mode === 'magic-link'}
        >
          Magic link
        </button>
      </div>

      <form
        onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}
        noValidate
        aria-label={mode === 'password' ? 'Password login form' : 'Magic link login form'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="auth-label mb-1.5 block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {mode === 'password' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="auth-label block text-sm font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className="auth-alt-link text-xs text-primary hover:text-primary/80"
                >
                  Use magic link instead
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
          )}

          {error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary auth-submit w-full"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                  aria-hidden="true"
                />
                {mode === 'password' ? 'Signing in…' : 'Sending link…'}
              </span>
            ) : mode === 'password' ? (
              'Sign in'
            ) : (
              'Send magic link'
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="auth-text-link font-medium text-primary hover:text-primary/80">
          Sign up free
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  )
}
