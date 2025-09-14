'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw } from 'lucide-react'
import { useAPIKeyStorage, useModelStorage, usePromptStorage, useContextFilesStorage } from '@/hooks/useSessionStorage'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  const { clearAPIKey } = useAPIKeyStorage()
  const { clearModel } = useModelStorage()
  const { clearPrompt } = usePromptStorage()
  const { clearFiles } = useContextFilesStorage()

  const handleReset = () => {
    // Clear all session data
    clearAPIKey()
    clearModel()
    clearPrompt()
    clearFiles()
    
    // Refresh the page to reset component state
    window.location.reload()
  }

  return (
    <header className={`border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-border ${className}`}>
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

          {/* Reset Button - Right aligned */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-muted-foreground hover:text-foreground"
            title="Clear all session data and start over"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </nav>
    </header>
  )
}
