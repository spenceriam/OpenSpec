'use client'

import { Badge } from '@/components/ui/badge'
import { Zap, Heart } from 'lucide-react'
import Link from 'next/link'
import { VERSION_DISPLAY, GIT_COMMIT } from '@/lib/version'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-border ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="relative">
          {/* Version info - bottom left */}
          <div className="absolute left-0 bottom-0 text-xs text-muted-foreground/60">
            <span 
              title={`Git commit: ${GIT_COMMIT}`}
              className="font-mono hover:text-muted-foreground transition-colors cursor-help"
            >
              {VERSION_DISPLAY}
            </span>
          </div>
          
          {/* Main content - centered */}
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
                  <Link 
                    href="https://github.com/spenceriam/openspec" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  © {currentYear} OpenSpec. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
