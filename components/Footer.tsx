'use client'

import { Badge } from '@/components/ui/badge'
import { Zap, Heart } from 'lucide-react'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t bg-background ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Centered brand section */}
        <div className="flex flex-col items-center space-y-6">
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
          
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Democratizing spec-driven development with AI-powered specification generation.
          </p>

          {/* Bottom section */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> by the community
            </div>
            <p className="text-xs text-muted-foreground">
              © {currentYear} OpenSpec. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
