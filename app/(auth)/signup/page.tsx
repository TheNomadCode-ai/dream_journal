'use client'

import { useState } from 'react'

import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { getAppUrl } from '@/lib/app-url'

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const supabase = createClient()

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.'
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.'
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.'
    return null
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    const appUrl = getAppUrl()
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : appUrl
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          wake_time: wakeTime,
          wake_timezone: timezone,
          timezone,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    setConfirmationSent(true)
    setLoading(false)
  }

  if (confirmationSent) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <div className="mb-4 text-4xl">🌙</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Check your email</h2>
        <p className="text-muted-foreground">
          We sent a confirmation link to{' '}
          <strong className="text-foreground">{email}</strong>.
          <br />
          Click the link to activate your account and start your first dream journal.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="auth-heading text-2xl font-bold text-foreground">Start dreaming</h1>
        <p className="auth-subheading mt-1 text-sm text-muted-foreground">
          Create your free Somnia account
        </p>
      </div>

      <form onSubmit={handleSignup} noValidate aria-label="Sign up form">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="auth-label mb-1.5 block text-sm font-medium text-foreground"
            >
              Your name
            </label>
            <input
              id="display-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="form-input"
              placeholder="Alex"
            />
          </div>

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
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="form-input"
              placeholder="you@example.com"
              aria-describedby={error ? 'signup-error' : undefined}
            />
          </div>

          <div>
            <label htmlFor="password" className="auth-label mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="auth-help mt-1 text-xs text-muted-foreground">
              At least 8 characters with uppercase, number, and special character
            </p>
          </div>

          <div>
            <label htmlFor="wake-time" className="auth-label mb-1.5 block text-sm font-medium text-foreground">
              What time do you wake up?
            </label>
            <input
              id="wake-time"
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="form-input"
            />
          </div>

          {error && (
            <p
              id="signup-error"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !displayName || !wakeTime}
            className="btn-primary auth-submit w-full"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                  aria-hidden="true"
                />
                Creating account…
              </span>
            ) : (
              'Create free account'
            )}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing up you agree to our{' '}
        <Link href="/terms" className="auth-text-link underline hover:text-foreground">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="auth-text-link underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="auth-text-link font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </>
  )
}
