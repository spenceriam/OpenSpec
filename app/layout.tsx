import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenSpec - Open Source Specification Generator',
  description: 'Generate comprehensive technical specifications using AI models from OpenRouter. Create requirements, design documents, and implementation tasks with automatic diagram generation.',
  keywords: [
    'specification',
    'technical documentation',
    'AI',
    'OpenRouter',
    'requirements',
    'design',
    'implementation',
    'mermaid diagrams',
    'markdown'
  ],
  authors: [{ name: 'OpenSpec Team' }],
  creator: 'OpenSpec',
  publisher: 'OpenSpec',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen bg-background text-foreground">
            <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center">
                  <a href="/" className="mr-6 flex items-center space-x-2">
                    <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">O</span>
                    </div>
                    <span className="hidden font-bold sm:inline-block">OpenSpec</span>
                  </a>
                </div>
              </header>
              
              <main className="flex-1">
                {children}
              </main>
              
              <footer className="border-t bg-background py-4">
                <div className="container text-center text-sm text-muted-foreground">
                  © {new Date().getFullYear()} OpenSpec. Built with Next.js and OpenRouter.
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
