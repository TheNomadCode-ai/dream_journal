import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <a href="/" className="mb-8 flex items-center gap-2 text-foreground hover:opacity-80">
        <span className="text-2xl" aria-hidden="true">🌙</span>
        <span className="text-xl font-bold tracking-tight">Somnia</span>
      </a>

      {/* Auth card */}
      <div className="card w-full max-w-md p-8">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground">
        Privacy-first · Your data, your dreams
      </p>
    </div>
  )
}
