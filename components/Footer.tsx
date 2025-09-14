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
    <footer className={`border-t bg-background ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold">OpenSpec</span>
              <div className="flex items-center space-x-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  Beta
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  Open Source
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Right side - Description and attribution */}
          <div className="flex flex-col items-start sm:items-end space-y-2">
            <p className="text-sm text-muted-foreground">
              Built to solve agentic coding needs for open source development.
            </p>
            <div className="flex flex-col items-start sm:items-end gap-1">
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
