import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AppAuthPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: '100dvh',
      }}
    >
      {children}
    </main>
  )
}
