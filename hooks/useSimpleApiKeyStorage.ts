'use client'

import { useState, useEffect, useCallback } from 'react'

const API_KEY_STORAGE_KEY = 'openspec-api-key'
const API_KEY_TESTED_KEY = 'openspec-api-key-tested'

export function useSimpleApiKeyStorage() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  
  // Initialize from storage on mount only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = sessionStorage.getItem(API_KEY_STORAGE_KEY)
      const tested = sessionStorage.getItem(API_KEY_TESTED_KEY)
      
      setApiKeyState(key)
      setIsValidated(tested === 'true')
      
      console.log('SimpleApiKeyStorage initialized:', {
        hasKey: !!key,
        isValidated: tested === 'true'
      })
    }
  }, [])
  
  // Listen for storage changes to sync state across hook instances
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = () => {
      const key = sessionStorage.getItem(API_KEY_STORAGE_KEY)
      const tested = sessionStorage.getItem(API_KEY_TESTED_KEY)
      
      console.log('SimpleApiKeyStorage: Storage changed, updating state:', {
        key: key ? 'present' : 'null',
        tested: tested === 'true'
      })
      
      setApiKeyState(key)
      setIsValidated(tested === 'true')
    }
    
    // Listen for storage changes from other tabs (though unlikely in this app)
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom events from within the same tab (our use case)
    window.addEventListener('openspec-api-key-change', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('openspec-api-key-change', handleStorageChange)
    }
  }, [])
  
  const setAPIKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, key)
      sessionStorage.setItem(API_KEY_TESTED_KEY, 'true')
      // Emit custom event to sync all hook instances
      window.dispatchEvent(new CustomEvent('openspec-api-key-change'))
    }
    setApiKeyState(key)
    setIsValidated(true)
    
    console.log('SimpleApiKeyStorage: API key set and validated')
  }, [])
  
  const clearAPIKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY)
      sessionStorage.removeItem(API_KEY_TESTED_KEY)
      // Emit custom event to sync all hook instances
      window.dispatchEvent(new CustomEvent('openspec-api-key-change'))
    }
    setApiKeyState(null)
    setIsValidated(false)
    
    console.log('SimpleApiKeyStorage: API key cleared')
  }, [])
  
  // Simple validation check
  const isValidFormat = apiKey ? apiKey.startsWith('sk-or-') || apiKey.startsWith('sk-') : false
  const hasValidKey = Boolean(apiKey && isValidFormat && isValidated)
  
  return {
    value: apiKey,
    hasValidKey,
    setAPIKey,
    clearAPIKey
  }
}