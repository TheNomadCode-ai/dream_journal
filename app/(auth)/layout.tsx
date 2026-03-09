import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter auth-shell flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <a href="/" className="auth-logo mb-8 flex items-center gap-2 text-foreground hover:opacity-80">
        <span className="text-2xl" aria-hidden="true">🌙</span>
        <span className="text-xl font-bold tracking-tight">Somnia</span>
      </a>

      {/* Auth card */}
      <div className="card auth-card w-full max-w-md p-8">
        {children}
      </div>

      {/* Footer */}
      <p className="auth-footer-note mt-8 text-xs text-muted-foreground">
        Privacy-first · Your data, your dreams
      </p>
    </div>
  )
}
