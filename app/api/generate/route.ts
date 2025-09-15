import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterClient } from '@/lib/openrouter/client'
import { GenerateCompletionRequest } from '@/types'

// Simple token estimator (approx 3.7 chars per token)
function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / 3.7)
}

// Middle-out truncation to fit a character budget while preserving the most informative parts
function middleOut(text: string, targetChars: number): string {
  if (text.length <= targetChars) return text
  const head = Math.floor(targetChars * 0.6)
  const tail = Math.floor(targetChars * 0.35)
  const buffer = targetChars - head - tail
  const headText = text.slice(0, head)
  const tailText = text.slice(-tail)
  return `${headText}\n\n[... ${buffer >= 0 ? 'content omitted for length' : 'truncated'} ...]\n\n${tailText}`
}

// Removes obvious base64/data URLs or long hexdumps from prompts
function stripBinaryLikeSequences(text: string): string {
  // Remove data URLs and long base64 chunks
  const dataUrlRegex = /data:[^;]+;base64,[A-Za-z0-9+/=]{256,}/g
  const longBase64Regex = /[A-Za-z0-9+/=]{512,}/g
  return text
    .replace(dataUrlRegex, '[binary data omitted]')
    .replace(longBase64Regex, '[base64 omitted]')
}

// Clamp combined prompts to fit within a conservative context budget
function clampPrompts(systemPrompt: string, userPrompt: string, contextLimitTokens = 32768, maxOutputTokens = 8192) {
  // Reserve a safety buffer of 10% of remaining input tokens
  const inputBudgetTokens = Math.max(1000, Math.floor((contextLimitTokens - maxOutputTokens) * 0.9))
  const inputBudgetChars = Math.max(4000, Math.floor(inputBudgetTokens * 3.7))

  // Sanitize obvious binary content first
  let cleanSystem = stripBinaryLikeSequences(systemPrompt || '')
  let cleanUser = stripBinaryLikeSequences(userPrompt || '')

  const combined = `${cleanSystem}\n\n${cleanUser}`
  if (combined.length <= inputBudgetChars) {
    return { system: cleanSystem, user: cleanUser }
  }

  // Prefer trimming user content first, keep system mostly intact but capped
  const maxSystemChars = Math.min(cleanSystem.length, Math.floor(inputBudgetChars * 0.25))
  cleanSystem = cleanSystem.length > maxSystemChars ? middleOut(cleanSystem, maxSystemChars) : cleanSystem

  const remainingForUser = Math.max(2000, inputBudgetChars - cleanSystem.length)
  cleanUser = middleOut(cleanUser, remainingForUser)

  return { system: cleanSystem, user: cleanUser }
}

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 60, // per minute
  WINDOW_MS: 60 * 1000 // 1 minute
}

function getRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const clientData = rateLimitMap.get(clientIP)

  if (!clientData || now > clientData.resetTime) {
    // Reset or create new entry
    const newData = {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS
    }
    rateLimitMap.set(clientIP, newData)
    return {
      allowed: true,
      remaining: RATE_LIMIT.MAX_REQUESTS - 1,
      resetTime: newData.resetTime
    }
  }

  if (clientData.count >= RATE_LIMIT.MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: clientData.resetTime
    }
  }

  clientData.count++
  rateLimitMap.set(clientIP, clientData)

  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_REQUESTS - clientData.count,
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = getRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON in request body'
          }
        },
        { status: 400 }
      )
    }

    // Validate required fields
    const { apiKey, model, systemPrompt, userPrompt, contextFiles, options } = body

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

    if (!model) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_MODEL',
            message: 'Model selection is required'
          }
        },
        { status: 400 }
      )
    }

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PROMPTS',
            message: 'Both system and user prompts are required'
          }
        },
        { status: 400 }
      )
    }

    // Create OpenRouter client
    const client = new OpenRouterClient(apiKey)

    // Determine conservative context limit if not known. Many providers cap at ~32K.
    const assumedContextLimit = 32768
    const maxOutput = options?.max_tokens ?? 8192

    // Clamp prompts defensively to avoid overflows regardless of upstream bugs
    const clamped = clampPrompts(systemPrompt, userPrompt, assumedContextLimit, maxOutput)

    // Generate completion
    const completion = await client.generateCompletion(
      model,
      clamped.system,
      clamped.user,
      [],
      { ...options, max_tokens: maxOutput }
    )

    // Return successful response
    return NextResponse.json(
      {
        content: completion,
        model: model,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
        }
      }
    )

  } catch (error: any) {
    console.error('Error in /api/generate:', error)

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
          message: 'An internal server error occurred',
          retryable: true
        }
      },
      { status: 500 }
    )
  }
}

function getStatusCodeFromError(errorCode: string): number {
  switch (errorCode) {
    case 'INVALID_API_KEY':
      return 401
    case 'RATE_LIMITED':
      return 429
    case 'MODEL_NOT_FOUND':
      return 404
    case 'INSUFFICIENT_CREDITS':
      return 402
    case 'CONTEXT_TOO_LONG':
      return 413
    case 'NETWORK_ERROR':
      return 502
    case 'HTTP_400':
      return 400
    case 'HTTP_401':
      return 401
    case 'HTTP_403':
      return 403
    case 'HTTP_404':
      return 404
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