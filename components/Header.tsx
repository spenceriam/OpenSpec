'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useModelStorage, usePromptStorage, useContextFilesStorage } from '@/hooks/useSessionStorage'
import { useSimpleApiKeyStorage } from '@/hooks/useSimpleApiKeyStorage'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  const { clearAPIKey } = useSimpleApiKeyStorage()
  const { clearModel } = useModelStorage()
  const { clearPrompt } = usePromptStorage()
  const { clearFiles } = useContextFilesStorage()

  const handleReset = () => {
    console.log('=== HEADER RESET: Comprehensive Storage Clear ===')
    
    // Step 1: Clear all hook-managed data
    clearAPIKey()
    clearModel()
    clearPrompt()
    clearFiles()
    
    // Step 2: COMPREHENSIVE STORAGE CLEARING
    if (typeof window !== 'undefined') {
      console.log('=== CLEARING LOCALSTORAGE ===')
      // Clear all localStorage (not just OpenSpec keys)
      localStorage.clear()
      
      console.log('=== CLEARING SESSIONSTORAGE ===')
      // Clear all sessionStorage
      sessionStorage.clear()
      
      // Set reset flag to prevent auto-restore
      sessionStorage.setItem('openspec-just-reset', 'true')
      
      console.log('=== STORAGE CLEARED - Set reset flag ===')
    }
    
    // Step 3: Force page reload for complete reset
    setTimeout(() => {
      console.log('=== FORCING PAGE RELOAD ===')
      window.location.reload()
    }, 100)
  }

  return (
    <header className={`border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-border ${className}`}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* OpenSpec Logo - Left aligned */}
          <Link href="/" className="flex items-center -m-1.5 p-1.5">
            <Image
              src="/OpenSpec_logo.png"
              alt="OpenSpec"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
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
