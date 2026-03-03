import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'DreamLog — Privacy-first AI Dream Journal',
  description:
    'Understand your dreams. Own your data. A private dream journal with AI pattern recognition.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
