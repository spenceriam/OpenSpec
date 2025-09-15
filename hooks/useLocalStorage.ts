'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { StorageInfo } from '@/types'

// Storage quota detection
const getStorageQuota = async (): Promise<{ quota: number; usage: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0
      }
    } catch (error) {
      console.warn('Storage quota estimation failed:', error)
    }
  }
  
  // Fallback estimation
  const testData = 'x'.repeat(1024) // 1KB test string
  let usage = 0
  
  try {
    // Estimate current usage by attempting to store test data
    for (let i = 0; i < 10; i++) {
      localStorage.setItem(`__test_${i}`, testData)
      usage += testData.length * 2 // UTF-16 characters are 2 bytes each
      localStorage.removeItem(`__test_${i}`)
    }
  } catch (error) {
    // If we hit the limit, we've found the approximate usage
  }
  
  return {
    quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
    usage: new Blob([JSON.stringify(localStorage)]).size
  }
}

export interface UseLocalStorageOptions<T> {
  defaultValue: T
  autoSave?: boolean
  autoSaveDelay?: number
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
  onError?: (error: Error, operation: 'get' | 'set' | 'remove') => void
  onStorageChange?: (newValue: T, oldValue: T) => void
  validateData?: (data: any) => data is T
}

export interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: T | ((prev: T) => T)) => void
  remove: () => void
  isLoading: boolean
  error: Error | null
  storageInfo: StorageInfo | null
  clearError: () => void
  forceSync: () => void
}

export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    defaultValue,
    autoSave = true,
    autoSaveDelay = 30000, // 30 seconds
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError,
    onStorageChange,
    validateData
  } = options

  const [value, setStateValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevValueRef = useRef<T>(defaultValue)
  const isInitializedRef = useRef(false)

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      const { quota, usage } = await getStorageQuota()
      setStorageInfo({
        quota,
        used: usage,
        available: quota - usage,
        percentUsed: quota > 0 ? (usage / quota) * 100 : 0
      })
    } catch (error) {
      console.warn('Failed to update storage info:', error)
    }
  }, [])

  // Get value from localStorage
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }

      const parsed = deserialize(item)
      
      // Validate data if validator is provided
      if (validateData && !validateData(parsed)) {
        console.warn(`Invalid data found in localStorage for key "${key}"`)
        return defaultValue
      }

      return parsed
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err, 'get')
      setError(err)
      return defaultValue
    }
  }, [key, defaultValue, deserialize, validateData, onError])

  // Set value to localStorage
  const setStoredValue = useCallback(
    (valueToStore: T) => {
      if (typeof window === 'undefined') {
        return
      }

      try {
        const serialized = serialize(valueToStore)
        
        // Check if we're close to quota limit
        if (storageInfo && storageInfo.percentUsed > 90) {
          const warning = new Error(
            `Storage is ${storageInfo.percentUsed.toFixed(1)}% full. Consider exporting your data.`
          )
          onError?.(warning, 'set')
          setError(warning)
        }

        localStorage.setItem(key, serialized)
        updateStorageInfo()
        
        // Notify of changes
        const oldValue = prevValueRef.current
        if (onStorageChange && oldValue !== valueToStore) {
          onStorageChange(valueToStore, oldValue)
        }
        
        prevValueRef.current = valueToStore
        
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          const quotaError = new Error(
            'Storage quota exceeded. Please export your data and clear some space.'
          )
          onError?.(quotaError, 'set')
          setError(quotaError)
        } else {
          const err = error instanceof Error ? error : new Error(String(error))
          onError?.(err, 'set')
          setError(err)
        }
      }
    },
    [key, serialize, storageInfo, updateStorageInfo, onError, onStorageChange]
  )

  // Set value with auto-save capability
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue
      setStateValue(valueToStore)

      if (autoSave) {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }

        // Set new timeout for auto-save
        autoSaveTimeoutRef.current = setTimeout(() => {
          setStoredValue(valueToStore)
        }, autoSaveDelay)
      } else {
        // Save immediately if auto-save is disabled
        setStoredValue(valueToStore)
      }
    },
    [value, autoSave, autoSaveDelay, setStoredValue]
  )

  // Force immediate sync to localStorage
  const forceSync = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }
    setStoredValue(value)
  }, [value, setStoredValue])

  // Remove value from localStorage
  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(key)
      setStateValue(defaultValue)
      prevValueRef.current = defaultValue
      updateStorageInfo()
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err, 'remove')
      setError(err)
    }
  }, [key, defaultValue, updateStorageInfo, onError])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize value from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) {
      return // Already initialized
    }
    
    // Get value directly to avoid dependency chain
    let storedValue = defaultValue
    if (typeof window !== 'undefined') {
      // Check if we just did a reset - if so, use default value instead of stored
      const justReset = sessionStorage.getItem('openspec-just-reset')
      if (justReset && key.includes('openspec')) {
        console.log(`=== LOCALSTORAGE HOOK (${key}): Detected reset flag, using default value ===`)
        storedValue = defaultValue
      } else {
        try {
          const item = localStorage.getItem(key)
          if (item !== null) {
            const parsed = deserialize(item)
            if (!validateData || validateData(parsed)) {
              storedValue = parsed
              console.log(`=== LOCALSTORAGE HOOK (${key}): Loaded from storage ===`)
            }
          }
        } catch (error) {
          console.warn(`Failed to load from localStorage key "${key}":`, error)
        }
      }
    }
    
    setStateValue(storedValue)
    prevValueRef.current = storedValue
    setIsLoading(false)
    isInitializedRef.current = true
    updateStorageInfo()
  }, [key, defaultValue, deserialize, validateData]) // Static dependencies only

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserialize(e.newValue)
          if (!validateData || validateData(newValue)) {
            setStateValue(newValue)
            prevValueRef.current = newValue
          }
        } catch (error) {
          console.warn('Failed to sync storage change from other tab:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, validateData])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        // Force save on unmount if there are pending changes
        if (isInitializedRef.current) {
          setStoredValue(value)
        }
      }
    }
  }, [value, setStoredValue])

  // Auto-save before page unload
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        setStoredValue(value)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [value, setStoredValue])

  return {
    value,
    setValue,
    remove,
    isLoading,
    error,
    storageInfo,
    clearError,
    forceSync
  }
}