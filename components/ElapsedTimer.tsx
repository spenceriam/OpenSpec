'use client'

import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface ElapsedTimerProps {
  startTime: number
  isRunning: boolean
  className?: string
  showIcon?: boolean
  compact?: boolean
}

export function ElapsedTimer({ startTime, isRunning, className = '', showIcon = true, compact = false }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const updateElapsed = () => {
      setElapsed(Date.now() - startTime)
    }

    // Update immediately
    updateElapsed()

    // Then update every second
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  if (!isRunning) return null

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground animate-pulse ${className}`}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span>{compact ? formatElapsed(elapsed) : `Elapsed: ${formatElapsed(elapsed)}`}</span>
    </div>
  )
}

export default ElapsedTimer