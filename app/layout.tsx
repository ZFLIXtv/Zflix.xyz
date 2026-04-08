import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import './globals.css'
import { MaintenanceBanner } from '@/components/layout/MaintenanceBanner'
import ToastProvider from '@/components/ui/Toast'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

// Gardé pour compatibilité avec les classes font-[Outfit] existantes
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ZFlix — Votre cinéma personnel',
  description:
    'Films, séries et animés en streaming HD sur tous vos appareils. Accédez à plus de 15 000 titres avec ZFlix, votre plateforme de streaming personnelle.',
  keywords: ['streaming', 'films', 'séries', 'animés', 'HD', 'Jellyfin', 'cinéma'],
  authors: [{ name: 'ZFlix' }],
  openGraph: {
    title: 'ZFlix — Votre cinéma personnel',
    description:
      'Films, séries et animés en streaming HD. Sur tous vos appareils.',
    url: 'https://zflix.fr',
    siteName: 'ZFlix',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZFlix — Votre cinéma personnel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZFlix — Votre cinéma personnel',
    description: 'Films, séries et animés en streaming HD. Sur tous vos appareils.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#171D20',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${outfit.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="noise-bg" aria-hidden="true" />
        <ToastProvider>
          <MaintenanceBanner />
          <main className="relative z-10">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
