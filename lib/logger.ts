import { captureError, captureMessage } from '@/lib/sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`
}

/**
 * Structured logger.
 *
 * - debug: local development only, never sent to Sentry
 * - info:  console + Sentry breadcrumb in production
 * - warn:  console.warn + Sentry message (level: warning)
 * - error: console.error + Sentry captureException / captureMessage
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!IS_PRODUCTION) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage('info', message, context))
    if (IS_PRODUCTION) {
      captureMessage(message, 'info', context)
    }
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context))
    captureMessage(message, 'warning', context)
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const mergedContext: LogContext = { ...context }
    if (error instanceof Error) {
      mergedContext.errorMessage = error.message
      mergedContext.errorStack = error.stack
    }

    console.error(formatMessage('error', message, mergedContext))

    if (error instanceof Error) {
      captureError(error, { logMessage: message, ...context })
    } else if (error !== undefined) {
      captureMessage(`${message}: ${String(error)}`, 'error', context)
    } else {
      captureMessage(message, 'error', context)
    }
  },
}
