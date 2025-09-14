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
  showTestButton?: boolean
  autoTest?: boolean
  className?: string
}

export function ApiKeyInput({ 
  onApiKeyValidated, 
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
    <Card className={`api-key-input ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle className="text-lg">OpenRouter API Key</CardTitle>
          {hasValidKey && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription id="api-key-description">
          Enter your OpenRouter API key to access AI models for spec generation.{' '}
          <a 
            href="https://openrouter.ai/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Get your API key from OpenRouter <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current key status */}
        {apiKey && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current key:</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {showKey ? apiKey : keyMasked}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="h-6 w-6 p-0"
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearKey}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        )}

        {/* API key input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="Enter your OpenRouter API key"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pr-20"
              disabled={isTestingKey}
              aria-label="OpenRouter API Key"
              aria-describedby="api-key-description"
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="h-6 w-6 p-0"
                disabled={isTestingKey}
                aria-label="toggle key visibility"
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            {showSaveButton && (
              <Button 
                onClick={handleSaveKey}
                disabled={isTestingKey}
                size="sm"
              >
                {isTestingKey && autoTest ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
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
                size="sm"
              >
                {isTestingKey ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Key'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <Alert variant={testResult.isValid ? "default" : "destructive"}>
            {testResult.isValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.isValid ? (
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-1">
                    <span>✓</span>
                    <span>API key validated successfully</span>
                  </div>
                  {testResult.credits !== undefined && (
                    <div className="text-sm">
                      Credits: ${testResult.credits?.toFixed(2) || '0.00'}
                    </div>
                  )}
                  {testResult.models !== undefined && (
                    <div className="text-sm">
                      Available models: {testResult.models}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="font-medium flex items-center gap-1">
                    <span>✗</span>
                    <span>API key validation failed</span>
                  </span>
                  {testResult.error && (
                    <div className="mt-1">{testResult.error}</div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Security notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm">
              <strong>Privacy Notice:</strong> Your API key is stored securely in your browser's 
              session storage and will be cleared when you close the browser. It is never sent 
              to our servers - all API calls go directly to OpenRouter.
            </div>
          </AlertDescription>
        </Alert>

        {/* Usage information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• API keys starting with "sk-or-" are OpenRouter keys</div>
          <div>• Keys starting with "sk-" are also supported</div>
          <div>• Keys are validated by testing connection to OpenRouter</div>
          <div>• All data is stored locally and cleared on browser close</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApiKeyInput