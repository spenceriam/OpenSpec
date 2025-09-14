'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SessionData } from '@/types'

export interface UseSessionStorageOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  onError?: (error: Error, operation: 'get' | 'set' | 'remove') => void
  onStorageChange?: (newValue: string | null, oldValue: string | null) => void
  validateKey?: (key: string) => boolean
}

export interface UseSessionStorageReturn {
  value: string | null
  setValue: (value: string | null) => void
  remove: () => void
  isValid: boolean
  error: Error | null
  clearError: () => void
  testConnection: () => Promise<boolean>
}

// Simple API key validation patterns
const API_KEY_PATTERNS = {
  openrouter: /^sk-or-[\w-]+$/,
  openai: /^sk-[\w-]+$/,
  anthropic: /^sk-ant-[\w-]+$/,
  generic: /^[\w-]+$/ // Fallback for other providers
}

function validateAPIKey(key: string): boolean {
  if (!key || key.length < 10) {
    return false
  }

  // Check against known patterns
  for (const pattern of Object.values(API_KEY_PATTERNS)) {
    if (pattern.test(key)) {
      return true
    }
  }

  return false
}

export function useSessionStorage(
  key: string,
  options: UseSessionStorageOptions = {}
): UseSessionStorageReturn {
  const {
    autoSave = false, // Session storage doesn't need auto-save as it's already session-based
    autoSaveDelay = 1000,
    onError,
    onStorageChange,
    validateKey = validateAPIKey
  } = options

  const [value, setStateValue] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isValid, setIsValid] = useState<boolean>(false)
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevValueRef = useRef<string | null>(null)
  const onErrorRef = useRef(onError)
  const validateKeyRef = useRef(validateKey)

  // Update refs when options change
  useEffect(() => {
    onErrorRef.current = onError
    validateKeyRef.current = validateKey
  }, [onError, validateKey])

  // Get value from sessionStorage
  const getStoredValue = useCallback((): string | null => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const item = sessionStorage.getItem(key)
      return item
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onErrorRef.current?.(err, 'get')
      setError(err)
      return null
    }
  }, [key])

  // Set value to sessionStorage
  const setStoredValue = useCallback(
    (valueToStore: string | null) => {
      if (typeof window === 'undefined') {
        return
      }

      try {
        if (valueToStore === null) {
          sessionStorage.removeItem(key)
        } else {
          sessionStorage.setItem(key, valueToStore)
        }
        
        // Notify of changes
        const oldValue = prevValueRef.current
        if (onStorageChange && oldValue !== valueToStore) {
          onStorageChange(valueToStore, oldValue)
        }
        
        prevValueRef.current = valueToStore
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onErrorRef.current?.(err, 'set')
        setError(err)
      }
    },
    [key, onStorageChange]
  )

  // Set value with optional auto-save
  const setValue = useCallback(
    (newValue: string | null) => {
      setStateValue(newValue)
      
      // Validate the new value
      if (newValue && validateKeyRef.current) {
        const valid = validateKeyRef.current(newValue)
        setIsValid(valid)
        
        if (!valid) {
          setError(new Error('Invalid API key format'))
        } else {
          setError(null)
        }
      } else {
        setIsValid(false)
        setError(null)
      }

      if (autoSave) {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }

        // Set new timeout for auto-save
        autoSaveTimeoutRef.current = setTimeout(() => {
          setStoredValue(newValue)
        }, autoSaveDelay)
      } else {
        // Save immediately
        setStoredValue(newValue)
      }
    },
    [autoSave, autoSaveDelay, setStoredValue]
  )

  // Remove value from sessionStorage
  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      sessionStorage.removeItem(key)
      setStateValue(null)
      setIsValid(false)
      setError(null)
      prevValueRef.current = null
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onErrorRef.current?.(err, 'remove')
      setError(err)
    }
  }, [key])

  // Test API key connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!value || !isValid) {
      return false
    }

    try {
      // Test connection using the models endpoint
      const response = await fetch('/api/models', {
        method: 'GET',
        headers: {
          'X-API-Key': value
        }
      })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data.models) && data.models.length > 0
      }
      
      return false
    } catch (error) {
      console.warn('API key test failed:', error)
      return false
    }
  }, [value, isValid])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize value from sessionStorage on mount
  useEffect(() => {
    const storedValue = getStoredValue()
    if (storedValue) {
      setStateValue(storedValue)
      prevValueRef.current = storedValue
      
      if (validateKeyRef.current) {
        const valid = validateKeyRef.current(storedValue)
        setIsValid(valid)
        
        if (!valid) {
          setError(new Error('Stored API key has invalid format'))
        }
      }
    }
  }, [getStoredValue])

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        const newValue = e.newValue
        setStateValue(newValue)
        prevValueRef.current = newValue
        
        if (newValue && validateKeyRef.current) {
          const valid = validateKeyRef.current(newValue)
          setIsValid(valid)
          
          if (!valid) {
            setError(new Error('Invalid API key format from storage sync'))
          } else {
            setError(null)
          }
        } else {
          setIsValid(false)
          setError(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Clear session data when tab is closed (beforeunload)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      // Session storage is automatically cleared when the session ends,
      // but we can perform cleanup here if needed
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return {
    value,
    setValue,
    remove,
    isValid,
    error,
    clearError,
    testConnection
  }
}

// Specialized hook for API key management
export function useAPIKeyStorage(): UseSessionStorageReturn & {
  setAPIKey: (key: string) => void
  clearAPIKey: () => void
  hasValidKey: boolean
} {
  const [isAPITested, setIsAPITested] = useState(false)
  
  const sessionStorage = useSessionStorage('openspec-api-key', {
    validateKey: validateAPIKey,
    onError: (error, operation) => {
      console.warn(`API key ${operation} error:`, error)
    },
    onStorageChange: (newValue, oldValue) => {
      if (newValue && !oldValue) {
        console.info('API key added')
      } else if (!newValue && oldValue) {
        console.info('API key removed')
        setIsAPITested(false) // Clear test status when key is removed
      } else if (newValue && oldValue && newValue !== oldValue) {
        console.info('API key updated')
        setIsAPITested(false) // Clear test status when key changes
      }
    }
  })

  // Check for stored validation status
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.value) {
      const testStatus = window.sessionStorage.getItem('openspec-api-key-tested')
      setIsAPITested(testStatus === 'true')
    }
  }, [sessionStorage.value])

  const setAPIKey = useCallback((key: string) => {
    if (!key.trim()) {
      sessionStorage.setValue(null)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('openspec-api-key-tested')
      }
      setIsAPITested(false)
      return
    }
    sessionStorage.setValue(key.trim())
    // Mark as tested when set (assuming it was tested before setting)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('openspec-api-key-tested', 'true')
    }
    setIsAPITested(true)
  }, [sessionStorage])

  const clearAPIKey = useCallback(() => {
    sessionStorage.remove()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('openspec-api-key-tested')
    }
    setIsAPITested(false)
  }, [sessionStorage])

  const hasValidKey = Boolean(sessionStorage.value && sessionStorage.isValid && isAPITested)

  // Debug logging
  console.log('useAPIKeyStorage state:', {
    hasValue: Boolean(sessionStorage.value),
    isValid: sessionStorage.isValid,
    isAPITested,
    hasValidKey,
    apiKeyLength: sessionStorage.value?.length || 0
  })

  return {
    ...sessionStorage,
    setAPIKey,
    clearAPIKey,
    hasValidKey
  }
}

// Specialized hook for selected model storage
export function useModelStorage() {
  const [storedModel, setStoredModel] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('openspec-selected-model')
      if (stored) {
        try {
          setStoredModel(JSON.parse(stored))
        } catch (error) {
          console.warn('Failed to parse stored model:', error)
        }
      }
    }
  }, [])

  const setModel = useCallback((model: any) => {
    if (typeof window !== 'undefined') {
      if (model) {
        sessionStorage.setItem('openspec-selected-model', JSON.stringify(model))
        setStoredModel(model)
      } else {
        sessionStorage.removeItem('openspec-selected-model')
        setStoredModel(null)
      }
    }
  }, [])

  const clearModel = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('openspec-selected-model')
      setStoredModel(null)
    }
  }, [])

  return {
    selectedModel: storedModel,
    setModel,
    clearModel
  }
}

// Hook for prompt storage
export function usePromptStorage() {
  const [storedPrompt, setStoredPrompt] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('openspec-prompt')
      if (stored) {
        setStoredPrompt(stored)
      }
    }
  }, [])

  const setPrompt = useCallback((prompt: string) => {
    if (typeof window !== 'undefined') {
      if (prompt && prompt.trim()) {
        sessionStorage.setItem('openspec-prompt', prompt)
        setStoredPrompt(prompt)
      } else {
        sessionStorage.removeItem('openspec-prompt')
        setStoredPrompt('')
      }
    }
  }, [])

  const clearPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('openspec-prompt')
      setStoredPrompt('')
    }
  }, [])

  return {
    prompt: storedPrompt,
    setPrompt,
    clearPrompt
  }
}

// Hook for context files storage
export function useContextFilesStorage() {
  const [storedFiles, setStoredFiles] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('openspec-context-files')
      if (stored) {
        try {
          const files = JSON.parse(stored)
          setStoredFiles(Array.isArray(files) ? files : [])
        } catch (error) {
          console.warn('Failed to parse stored context files:', error)
          setStoredFiles([])
        }
      }
    }
  }, [])

  const setFiles = useCallback((files: any[]) => {
    if (typeof window !== 'undefined') {
      if (files && files.length > 0) {
        sessionStorage.setItem('openspec-context-files', JSON.stringify(files))
        setStoredFiles(files)
      } else {
        sessionStorage.removeItem('openspec-context-files')
        setStoredFiles([])
      }
    }
  }, [])

  const clearFiles = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('openspec-context-files')
      setStoredFiles([])
    }
  }, [])

  return {
    contextFiles: storedFiles,
    setFiles,
    clearFiles
  }
}
