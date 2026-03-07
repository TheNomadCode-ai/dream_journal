import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import InstallPrompt from '@/components/pwa/InstallPrompt'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Somnia — Privacy-first AI Dream Journal',
  description:
    'Understand your dreams. Own your data. A private dream journal with AI pattern recognition.',
  verification: {
    google: 'ifyBULX_Roh68V0iMQLWZ_7IeiSyC-Yfk989XkKOyoQ',
  },
  manifest: '/manifest.json',
  themeColor: '#C9A84C',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Somnia',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ServiceWorkerRegistrar />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
