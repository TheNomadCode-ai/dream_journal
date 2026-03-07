'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

const loadingMessages = [
  'Unlocking your dreams...',
  'Opening the vault...',
  'Almost there...',
]

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!loading) {
      setMsgIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [loading])

  function validatePassword(pw: string): string | null {
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      return 'Password must be at least 8 characters and include an uppercase letter, a number, and a symbol.'
    }
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
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName.trim(),
          display_name: displayName.trim(),
          wake_time: wakeTime,
          wake_timezone: timezone,
          timezone,
        },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Email confirmation is disabled, so session is created immediately.
    router.push('/onboarding')
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
              placeholder="Create a password"
              aria-describedby={error ? 'signup-error' : undefined}
            />
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

          {loading ? (
            <div className="auth-loading-shell" aria-live="polite" aria-busy="true">
              <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                style={{ animation: 'moonPulse 2s ease-in-out infinite' }}
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="somnia-signup-loader" cx="32%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="rgba(240,225,255,1)" />
                    <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="url(#somnia-signup-loader)" />
                <circle cx="66" cy="44" r="35" fill="#06040f" />
              </svg>
              <span className="auth-loading-message">{loadingMessages[msgIndex]}</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading || !email || !password || !displayName || !wakeTime}
              className="btn-primary auth-submit w-full"
              aria-busy={loading}
            >
              Create free account
            </button>
          )}
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
