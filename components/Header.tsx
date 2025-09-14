'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand - Left aligned */}
          <Link href="/" className="flex items-center space-x-2 -m-1.5 p-1.5">
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
          </Link>
        </div>
      </nav>
    </header>
  )
}
