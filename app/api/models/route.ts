import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterClient } from '@/lib/openrouter/client'
import { OpenRouterModel } from '@/types'

// Cache for models response (in production, use Redis with TTL)
let modelsCache: {
  data: OpenRouterModel[]
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Rate limiting for models endpoint
const modelsRateLimit = new Map<string, { count: number; resetTime: number }>()

const MODELS_RATE_LIMIT = {
  MAX_REQUESTS: 20, // per minute (lower than generate since models don't change often)
  WINDOW_MS: 60 * 1000
}

function getModelsRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const clientData = modelsRateLimit.get(clientIP)

  if (!clientData || now > clientData.resetTime) {
    const newData = {
      count: 1,
      resetTime: now + MODELS_RATE_LIMIT.WINDOW_MS
    }
    modelsRateLimit.set(clientIP, newData)
    return {
      allowed: true,
      remaining: MODELS_RATE_LIMIT.MAX_REQUESTS - 1,
      resetTime: newData.resetTime
    }
  }

  if (clientData.count >= MODELS_RATE_LIMIT.MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: clientData.resetTime
    }
  }

  clientData.count++
  modelsRateLimit.set(clientIP, clientData)

  return {
    allowed: true,
    remaining: MODELS_RATE_LIMIT.MAX_REQUESTS - clientData.count,
    resetTime: clientData.resetTime
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = getModelsRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests for models endpoint. Please try again later.',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MODELS_RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Get API key from query params or headers
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('apiKey') || request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_API_KEY',
            message: 'OpenRouter API key is required'
          }
        },
        { status: 400 }
      )
    }

    // Check cache first
    const now = Date.now()
    if (modelsCache && (now - modelsCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        {
          models: modelsCache.data,
          cached: true,
          timestamp: new Date(modelsCache.timestamp).toISOString()
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300', // 5 minutes
            'X-RateLimit-Limit': MODELS_RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
          }
        }
      )
    }

    // Create OpenRouter client and fetch models
    const client = new OpenRouterClient(apiKey)
    const models = await client.getAvailableModels()

    // Filter and sort models for better UX
    const processedModels = models
      .filter(model => {
        // Filter out models that might be deprecated or have issues
        return model.id && 
               model.name && 
               model.context_length > 0 &&
               model.pricing?.prompt &&
               model.pricing?.completion
      })
      .sort((a, b) => {
        // Sort by popularity/capability and then by name
        const aPopular = isPopularModel(a)
        const bPopular = isPopularModel(b)
        
        if (aPopular && !bPopular) return -1
        if (!aPopular && bPopular) return 1
        
        return a.name.localeCompare(b.name)
      })

    // Update cache
    modelsCache = {
      data: processedModels,
      timestamp: now
    }

    return NextResponse.json(
      {
        models: processedModels,
        cached: false,
        timestamp: new Date().toISOString(),
        count: processedModels.length
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-RateLimit-Limit': MODELS_RATE_LIMIT.MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
        }
      }
    )

  } catch (error: any) {
    console.error('Error in /api/models:', error)

    // Handle OpenRouter API errors
    if (error.code && error.message) {
      const statusCode = getStatusCodeFromError(error.code)
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable || false
          }
        },
        { status: statusCode }
      )
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch models',
          retryable: true
        }
      },
      { status: 500 }
    )
  }
}

function isPopularModel(model: OpenRouterModel): boolean {
  const popularIds = [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'google/gemini-pro',
    'mistralai/mistral-large',
    'openai/gpt-3.5-turbo'
  ]
  
  return popularIds.some(id => model.id.includes(id)) ||
         model.name.toLowerCase().includes('gpt-4') ||
         model.name.toLowerCase().includes('claude-3') ||
         model.name.toLowerCase().includes('gemini')
}

function getStatusCodeFromError(errorCode: string): number {
  switch (errorCode) {
    case 'INVALID_API_KEY':
      return 401
    case 'RATE_LIMITED':
      return 429
    case 'NETWORK_ERROR':
      return 502
    case 'HTTP_400':
      return 400
    case 'HTTP_401':
      return 401
    case 'HTTP_403':
      return 403
    case 'HTTP_429':
      return 429
    case 'HTTP_500':
    case 'HTTP_502':
    case 'HTTP_503':
      return 502
    default:
      return 500
  }
}