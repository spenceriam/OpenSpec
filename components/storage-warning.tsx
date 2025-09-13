'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Download, Trash2, X } from 'lucide-react'
import { StorageInfo } from '@/types'
import { cn } from '@/lib/utils'

interface StorageWarningProps {
  storageInfo: StorageInfo | null
  onExport?: () => void
  onClear?: () => void
  onDismiss?: () => void
  className?: string
}

export function StorageWarning({
  storageInfo,
  onExport,
  onClear,
  onDismiss,
  className
}: StorageWarningProps) {
  const [dismissed, setDismissed] = useState(false)

  // Don't show if no storage info or dismissed
  if (!storageInfo || dismissed) {
    return null
  }

  const { percentUsed, used, available, quota } = storageInfo
  const isNearFull = percentUsed >= 80
  const isFull = percentUsed >= 95

  // Don't show warning unless we're approaching limits
  if (percentUsed < 80) {
    return null
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getWarningLevel = () => {
    if (isFull) return 'critical'
    if (isNearFull) return 'warning'
    return 'info'
  }

  const getWarningColor = () => {
    const level = getWarningLevel()
    switch (level) {
      case 'critical':
        return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100'
      default:
        return 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100'
    }
  }

  const getProgressBarColor = () => {
    if (isFull) return 'bg-red-500'
    if (isNearFull) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-sm',
        getWarningColor(),
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                {isFull ? 'Storage Full' : 'Storage Warning'}
              </h3>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm mb-3">
              {isFull
                ? 'Your browser storage is full. Export your specifications before losing data.'
                : 'Your browser storage is getting full. Consider exporting your data soon.'}
            </p>

            {/* Storage usage bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Storage Used</span>
                <span>{percentUsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', getProgressBarColor())}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-gray-600 dark:text-gray-400">
                <span>{formatBytes(used)} used</span>
                <span>{formatBytes(available)} available</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {onExport && (
                <button
                  onClick={onExport}
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium',
                    'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
                    'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                  )}
                >
                  <Download className="w-3 h-3 mr-1.5" />
                  Export Data
                </button>
              )}
              
              {onClear && (
                <button
                  onClick={onClear}
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium',
                    'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
                    'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                  )}
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Clear Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to automatically show storage warnings
export function useStorageWarning(storageInfo: StorageInfo | null) {
  const [showWarning, setShowWarning] = useState(false)
  const [lastWarningLevel, setLastWarningLevel] = useState<number>(0)

  useEffect(() => {
    if (!storageInfo) {
      setShowWarning(false)
      return
    }

    const { percentUsed } = storageInfo
    
    // Show warning when crossing thresholds
    if (percentUsed >= 80 && lastWarningLevel < 80) {
      setShowWarning(true)
      setLastWarningLevel(80)
    } else if (percentUsed >= 95 && lastWarningLevel < 95) {
      setShowWarning(true)
      setLastWarningLevel(95)
    } else if (percentUsed < 80) {
      setShowWarning(false)
      setLastWarningLevel(0)
    }
  }, [storageInfo, lastWarningLevel])

  return {
    showWarning,
    dismissWarning: () => setShowWarning(false)
  }
}