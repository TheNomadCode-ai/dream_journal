import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import InstallPrompt from '@/components/pwa/InstallPrompt'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://somniavault.me'),
  title: {
    default: 'Somnia — Dream Journal That Locks After 2 Minutes',
    template: '%s | Somnia',
  },
  description:
    'The only dream journal built around the 2-minute window you have before your dreams fade. Set your alarm, write before it locks. Privacy-first, no ads.',
  keywords: [
    'dream journal',
    'dream journaling',
    'lucid dreaming',
    'dream diary',
    'best dream journal app',
    'how to remember dreams',
    'sleep journal',
    'dream tracking',
  ],
  authors: [{ name: 'Sushank Khanal' }],
  creator: 'Sushank Khanal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://somniavault.me',
    siteName: 'Somnia',
    title: 'Somnia — Dream Journal That Locks After 2 Minutes',
    description:
      'The only dream journal built around the 2-minute window you have before your dreams fade.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Somnia — Dream Journal That Locks After 2 Minutes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Somnia — Dream Journal That Locks After 2 Minutes',
    description:
      'The only dream journal built around the 2-minute window you have before your dreams fade.',
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
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ServiceWorkerRegistrar />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
