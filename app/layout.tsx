import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenSpec - AI-Powered Specification Generation',
  description: 'Generate comprehensive technical specifications using OpenRouter\'s AI models. Create requirements, design documents, and implementation tasks with automatic diagram generation.',
  keywords: [
    'specification generation',
    'technical documentation',
    'AI-powered development',
    'OpenRouter',
    'requirements engineering',
    'design documents',
    'Mermaid diagrams',
    'spec-driven development'
  ],
  authors: [{ name: 'OpenSpec Team' }],
  creator: 'OpenSpec',
  publisher: 'OpenSpec',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://openspec.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OpenSpec - AI-Powered Specification Generation',
    description: 'Generate comprehensive technical specifications using OpenRouter\'s AI models with automatic diagram generation.',
    url: 'https://openspec.dev',
    siteName: 'OpenSpec',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenSpec - AI-Powered Specification Generation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenSpec - AI-Powered Specification Generation',
    description: 'Generate comprehensive technical specifications using OpenRouter\'s AI models with automatic diagram generation.',
    images: ['/og-image.png'],
    creator: '@openspec',
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
    google: 'your-google-verification-code',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarnings>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} antialiased h-screen bg-background overflow-hidden`}>
        <ErrorBoundary>
          <div className="relative flex h-screen flex-col">
            <Header className="flex-shrink-0 z-50 w-full" />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
            <Footer className="flex-shrink-0" />
          </div>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  )
}
