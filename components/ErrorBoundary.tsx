'use client'

import { Component } from 'react'

import type { ErrorInfo, ReactNode } from 'react'

import { captureError } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, {
      componentStack: info.componentStack ?? undefined,
    })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="flex min-h-[40vh] flex-col items-center justify-center p-8 text-center"
        >
          <span className="mb-4 text-4xl" aria-hidden="true">🌑</span>
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, errorId: null })
              window.location.reload()
            }}
            className="btn-secondary mt-6"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
