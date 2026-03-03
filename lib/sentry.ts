import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust sample rates for your traffic volume.
    // 100% for errors, 10% for performance in production.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Replay 10% of sessions; 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    environment: process.env.NODE_ENV,

    // Ignore common noise
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors outside our control
      'Network request failed',
      'Load failed',
      'Failed to fetch',
    ],

    beforeSend(event) {
      // Strip PII from error messages
      if (event.request?.cookies) {
        event.request.cookies = '[Filtered]'
      }
      return event
    },
  })
}

/**
 * Capture an exception with optional context.
 * Use this instead of Sentry.captureException directly so we get
 * consistent context tagging.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Capture a structured message (non-fatal event).
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureMessage(message, level)
  })
}

/**
 * Set user context after authentication.
 * Call this after the user logs in.
 */
export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId })
  } else {
    Sentry.setUser(null)
  }
}
