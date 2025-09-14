'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Key, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { useAPIKeyStorage } from '../hooks/useSessionStorage'
import { OpenRouterClient } from '@/lib/openrouter/client'

interface ApiKeyInputProps {
  onApiKeyValidated?: (isValid: boolean, key?: string) => void
  onLoadingChange?: (loading: boolean) => void
  showTestButton?: boolean
  autoTest?: boolean
  className?: string
}

export function ApiKeyInput({ 
  onApiKeyValidated, 
  onLoadingChange,
  showTestButton = true,
  autoTest = false,
  className = '' 
}: ApiKeyInputProps) {
  const { value: apiKey, setAPIKey, clearAPIKey, isValid: isValidKey } = useAPIKeyStorage()
  const [inputValue, setInputValue] = useState(apiKey || '')
  
  // Update inputValue when apiKey changes from storage
  useEffect(() => {
    setInputValue(apiKey || '')
  }, [apiKey])
  const [showKey, setShowKey] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<{
    isValid: boolean
    error?: string
    credits?: number
    models?: number
  } | null>(null)
  const [hasTestedCurrentKey, setHasTestedCurrentKey] = useState(false)

  // Test API key validity
  const testApiKey = useCallback(async (keyToTest: string) => {
    if (!keyToTest.trim()) {
      setTestResult({ isValid: false, error: 'API key is required' })
      return false
    }

    setIsTestingKey(true)
    setTestResult(null)
    onLoadingChange?.(true)

    try {
      const client = new OpenRouterClient(keyToTest)
      
      // Test connection
      const isValid = await client.testConnection()
      
      if (isValid) {
        setTestResult({
          isValid: true
        })
        // Save valid key to sessionStorage
        setAPIKey(keyToTest)
        onApiKeyValidated?.(true, keyToTest)
        return true
      } else {
        setTestResult({
          isValid: false,
          error: 'Invalid API key'
        })
        // Clear invalid key from sessionStorage
        clearAPIKey()
        onApiKeyValidated?.(false, keyToTest)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test API key'
      setTestResult({
        isValid: false,
        error: `Validation failed: ${errorMessage}`
      })
      onApiKeyValidated?.(false)
      return false
    } finally {
      setIsTestingKey(false)
      setHasTestedCurrentKey(true)
      onLoadingChange?.(false)
    }
  }, [onApiKeyValidated])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setTestResult(null)
    setHasTestedCurrentKey(false)
    
    // Clear stored key if input is cleared
    if (!value.trim() && apiKey) {
      clearAPIKey()
      onApiKeyValidated?.(false)
    }
  }

  // Handle save API key
  const handleSaveKey = useCallback(async () => {
    const trimmedValue = inputValue.trim()
    
    if (!trimmedValue) {
      setTestResult({ isValid: false, error: 'Please enter an API key' })
      return
    }

    // Validate key format
    if (!trimmedValue.startsWith('sk-or-') && !trimmedValue.startsWith('sk-')) {
      setTestResult({ 
        isValid: false, 
        error: 'OpenRouter API keys should start with "sk-or-" or "sk-"' 
      })
      return
    }

    let isValid = false
    if (autoTest) {
      isValid = await testApiKey(trimmedValue)
    } else {
      isValid = true
    }

    if (isValid || !autoTest) {
      setAPIKey(trimmedValue)
      if (!autoTest) {
        onApiKeyValidated?.(true, trimmedValue)
      }
    }
  }, [inputValue, autoTest, testApiKey, setAPIKey, onApiKeyValidated])

  // Handle manual test
  const handleTestKey = useCallback(() => {
    const keyToTest = inputValue.trim() || apiKey
    if (!keyToTest) {
      setTestResult({ isValid: false, error: 'Please enter an API key' })
      onApiKeyValidated?.(false)
      return
    }
    
    // Validate key format
    if (!keyToTest.startsWith('sk-or-') && !keyToTest.startsWith('sk-')) {
      setTestResult({ 
        isValid: false, 
        error: 'Invalid API key format' 
      })
      onApiKeyValidated?.(false, keyToTest)
      return
    }
    
    testApiKey(keyToTest)
  }, [inputValue, apiKey, testApiKey])

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveKey()
    }
  }

  // Clear API key
  const handleClearKey = () => {
    setInputValue('')
    clearAPIKey()
    setTestResult(null)
    setHasTestedCurrentKey(false)
    onApiKeyValidated?.(false)
  }

  // Auto-test when component mounts with existing key
  useEffect(() => {
    if (apiKey && autoTest && !hasTestedCurrentKey && !isTestingKey) {
      testApiKey(apiKey)
    }
  }, [apiKey, autoTest, hasTestedCurrentKey, isTestingKey, testApiKey])

  const hasValidKey = apiKey && (isValidKey || (testResult?.isValid ?? false))
  const showSaveButton = inputValue.trim() && inputValue.trim() !== apiKey
  const keyMasked = apiKey ? `${apiKey.substring(0, 8)}${'*'.repeat(20)}${apiKey.substring(-4)}` : ''

  return (
    <Card className={`${className} border-border shadow-sm max-w-5xl mx-auto`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">OpenRouter API Key</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Connect your OpenRouter account to access AI models
              </CardDescription>
            </div>
          </div>
          {hasValidKey && (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current key status */}
        {apiKey && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Current key:</span>
              <code className="text-sm bg-background px-3 py-1 rounded border border-border font-mono text-foreground">
                {showKey ? apiKey : keyMasked}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                {showKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearKey}
              className="text-sm border-border text-foreground hover:bg-muted"
            >
              Clear
            </Button>
          </div>
        )}

        {/* API key input */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pr-12 h-12 text-base border-border focus:border-primary focus:ring-primary"
              disabled={isTestingKey}
              aria-label="OpenRouter API Key"
              aria-describedby="api-key-description"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="h-8 w-8 p-0 hover:bg-muted"
                disabled={isTestingKey}
                aria-label="toggle key visibility"
              >
                {showKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            {showSaveButton && (
              <Button 
                onClick={handleSaveKey}
                disabled={isTestingKey}
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
              >
                {isTestingKey && autoTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Save Key'
                )}
              </Button>
            )}
            
            {showTestButton && (
              <Button 
                type="button"
                variant="outline"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="border-border text-foreground hover:bg-muted"
              >
                {isTestingKey ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Key'
                )}
              </Button>
            )}
          </div>
          
          {/* Get API Key Link */}
          <div className="text-sm">
            <span className="text-muted-foreground">Don't have an API key? </span>
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
            >
              Get your API key from OpenRouter
            </a>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <Alert className={`border ${testResult.isValid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            {testResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription>
              {testResult.isValid ? (
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-2 text-green-400">
                    <span className="text-green-400">✓</span>
                    <span>API key validated successfully</span>
                  </div>
                  {testResult.credits !== undefined && (
                    <div className="text-sm text-green-300">
                      Credits: ${testResult.credits?.toFixed(2) || '0.00'}
                    </div>
                  )}
                  {testResult.models !== undefined && (
                    <div className="text-sm text-green-300">
                      Available models: {testResult.models}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="font-medium flex items-center gap-2 text-red-400">
                    <span className="text-red-400">✗</span>
                    <span>API key validation failed</span>
                  </div>
                  {testResult.error && (
                    <div className="mt-2 text-sm text-red-300">{testResult.error}</div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Privacy notice */}
        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Privacy Notice:</span> Your API key is stored securely in your browser's session storage and is never sent to our servers. All AI requests go directly to OpenRouter.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApiKeyInput