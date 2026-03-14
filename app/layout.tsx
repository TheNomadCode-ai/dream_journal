import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'

import InstalledAppBanner from '@/components/pwa/InstalledAppBanner'
import RoutePrefetcher from '@/components/navigation/RoutePrefetcher'
import TouchFeedback from '@/components/ui/TouchFeedback'
import { ProfileProvider } from '@/lib/ProfileContext'
import '../styles/globals.css'

const SmartOpenRedirect = dynamic(() => import('@/components/navigation/SmartOpenRedirect'), {
  ssr: false,
})

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://somniavault.me'),
  title: {
    default: 'Somnia - Dream Programming Practice',
    template: '%s | Somnia',
  },
  description: 'Plant a dream intention every evening and confirm what happened every morning.',
  keywords: [
    'dream incubation',
    'dream programming',
    'dream journal',
    'subconscious practice',
    'dream journal',
    'sleep research',
    'morning recall',
    'evening intention',
  ],
  authors: [{ name: 'Sushank Khanal' }],
  creator: 'Sushank Khanal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://somniavault.me',
    siteName: 'Somnia',
    title: 'Somnia - Dream Programming Practice',
    description: 'Plant a dream intention every evening and confirm what happened every morning.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Somnia - Dream Programming Practice',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Somnia - Dream Programming Practice',
    description: 'Plant a dream intention every evening and confirm what happened every morning.',
    images: ['/opengraph-image'],
    creator: '@sirberialo007',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'ifyBULX_Roh68V0iMQLWZ_7IeiSyC-Yfk989XkKOyoQ',
  },
  alternates: {
    canonical: 'https://somniavault.me',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
  },
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

export const viewport = {
  themeColor: '#06040f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="/register-sw.js" />

        {/* iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Somnia" />

        {/* Prevent zoom on input focus iPhone */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* Theme color - hides browser chrome */}
        <meta name="theme-color" content="#06040f" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <InstalledAppBanner />
        <RoutePrefetcher />
        <TouchFeedback />
        <ProfileProvider>
          <SmartOpenRedirect />
          {children}
        </ProfileProvider>
      </body>
    </html>
  )
}
