'use client'

import { Badge } from '@/components/ui/badge'
import { Zap, Heart } from 'lucide-react'
import Link from 'next/link'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-border ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Built to solve agentic coding needs for open source development.
            </p>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> for open source
                </span>
                <Link 
                  href="https://x.com/spencer_i_am" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @spencer_i_am
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                © {currentYear} OpenSpec. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
