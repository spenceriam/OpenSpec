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
  
  const setAPIKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, key)
      sessionStorage.setItem(API_KEY_TESTED_KEY, 'true')
    }
    setApiKeyState(key)
    setIsValidated(true)
    
    console.log('SimpleApiKeyStorage: API key set and validated')
  }, [])
  
  const clearAPIKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY)
      sessionStorage.removeItem(API_KEY_TESTED_KEY)
    }
    setApiKeyState(null)
    setIsValidated(false)
    
    console.log('SimpleApiKeyStorage: API key cleared')
  }, [])
  
  // Simple validation check
  const isValidFormat = apiKey ? apiKey.startsWith('sk-or-') || apiKey.startsWith('sk-') : false
  const hasValidKey = Boolean(apiKey && isValidFormat && isValidated)
  
  console.log('SimpleApiKeyStorage state:', {
    hasApiKey: !!apiKey,
    isValidFormat,
    isValidated,
    hasValidKey
  })
  
  return {
    value: apiKey,
    hasValidKey,
    setAPIKey,
    clearAPIKey
  }
}