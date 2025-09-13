'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle,
  RefreshCw,
  Bug,
  Home,
  Copy,
  CheckCircle,
  ExternalLink,
  FileText
} from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  resetError: () => void
  errorId: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetError()
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  errorId 
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const copyErrorDetails = async () => {
    const errorDetails = formatErrorDetails(error, errorInfo, errorId)
    
    try {
      await navigator.clipboard.writeText(errorDetails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const reloadPage = () => {
    window.location.reload()
  }

  const goHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-96 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl text-destructive">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. We apologize for the inconvenience.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error summary */}
          <Alert variant="destructive">
            <Bug className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Error: {error.name}</div>
              <div className="text-sm">{error.message}</div>
            </AlertDescription>
          </Alert>

          {/* Error ID */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Error ID:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {errorId}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={reloadPage} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <Button variant="outline" onClick={goHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Error details toggle */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </Button>
          </div>

          {/* Detailed error information */}
          {showDetails && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium mb-2">Stack Trace:</div>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </div>

              {errorInfo.componentStack && (
                <div className="text-sm">
                  <div className="font-medium mb-2">Component Stack:</div>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyErrorDetails}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Error Details
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2"
                >
                  <a
                    href="https://github.com/your-repo/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Report Issue
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Help text */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <div>• Try refreshing the page or restarting the workflow</div>
            <div>• If the error persists, try clearing your browser cache</div>
            <div>• Copy the error details when reporting issues</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component-specific error boundary
export function ComponentErrorBoundary({ 
  children, 
  name = 'Component',
  onError
}: { 
  children: React.ReactNode
  name?: string
  onError?: (error: Error) => void
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`${name} Error:`, error, errorInfo)
        onError?.(error)
      }}
      fallback={({ error, resetError, errorId }) => (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-destructive">
                  {name} Error
                </div>
                <div className="text-sm text-muted-foreground">
                  {error.message}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={resetError}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
              <Badge variant="outline" className="font-mono text-xs">
                {errorId}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for error reporting
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.error(`Error ${context ? `in ${context}` : ''}:`, error)
    
    // In a real app, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // errorReportingService.captureException(error, { errorId, context })
    }
    
    return errorId
  }, [])

  return { handleError }
}

// Utility function to format error details for copying
function formatErrorDetails(
  error: Error, 
  errorInfo: React.ErrorInfo, 
  errorId: string
): string {
  return `
Error Report
============
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Error Details:
Name: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo.componentStack || 'No component stack available'}

Additional Info:
- URL: ${window.location.href}
- Viewport: ${window.innerWidth}x${window.innerHeight}
- Language: ${navigator.language}
`.trim()
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: {
    name?: string
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    fallback?: React.ComponentType<ErrorFallbackProps>
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      onError={errorBoundaryConfig?.onError}
      fallback={errorBoundaryConfig?.fallback}
    >
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary