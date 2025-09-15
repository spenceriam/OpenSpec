import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterClient } from '@/lib/openrouter/client'

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

// Token estimation and prompt clamping utilities
function estimateTokens(text: string): number {
  // Based on OpenAI/Anthropic tokenization: ~3.7 chars per token for English
  return Math.ceil(text.length / 3.7)
}

// Note: isImageLike function available but not currently used in server-side route
// Context file filtering is handled client-side in useSpecWorkflow

function stripBinaryContent(text: string): string {
  // Remove base64 data URLs and other binary-like sequences
  return text
    // Remove data URLs (base64 images, PDFs, etc.)
    .replace(/data:[a-zA-Z0-9\/+;=,.-]+base64,[A-Za-z0-9+/=]+/g, '[BINARY_DATA_REMOVED]')
    // Remove long sequences that look like base64
    .replace(/[A-Za-z0-9+/]{200,}={0,2}/g, '[BINARY_SEQUENCE_REMOVED]')
    // Remove other potential binary markers
    .replace(/\x00[\x00-\x1F]{10,}/g, '[BINARY_CONTENT_REMOVED]')
}

function clampPrompts(
  systemPrompt: string, 
  userPrompt: string, 
  contextLimitTokens: number = 32768, 
  maxOutputTokens: number = 8192
): { system: string; user: string; estimated: number; clamped: boolean } {
  // Validate inputs
  if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string') {
    throw new Error('System and user prompts must be strings')
  }
  
  // Clean binary content first
  const cleanSystem = stripBinaryContent(systemPrompt)
  const cleanUser = stripBinaryContent(userPrompt)
  
  // Calculate safe input budget (leave buffer for output tokens)
  const inputBudget = contextLimitTokens - maxOutputTokens - 100 // Small buffer
  const systemTokens = estimateTokens(cleanSystem)
  const userTokens = estimateTokens(cleanUser)
  const totalInputTokens = systemTokens + userTokens
  
  // Server-side token clamping applied
  
  // If within budget, return cleaned content
  if (totalInputTokens <= inputBudget) {
    return {
      system: cleanSystem,
      user: cleanUser,
      estimated: totalInputTokens,
      clamped: cleanSystem !== systemPrompt || cleanUser !== userPrompt
    }
  }
  
  // Need to clamp - preserve system prompt (usually smaller), clamp user prompt
  let finalSystem = cleanSystem
  let finalUser = cleanUser
  
  // If system prompt is too large, truncate it first
  const maxSystemTokens = Math.floor(inputBudget * 0.2) // 20% for system
  if (systemTokens > maxSystemTokens) {
    const maxSystemChars = maxSystemTokens * 3.7
    finalSystem = cleanSystem.substring(0, Math.floor(maxSystemChars)) + '\n\n[System prompt truncated to fit token limits]'
  }
  
  // Calculate remaining budget for user prompt
  const finalSystemTokens = estimateTokens(finalSystem)
  const userBudget = inputBudget - finalSystemTokens
  
  if (estimateTokens(finalUser) > userBudget) {
    const maxUserChars = userBudget * 3.7
    
    // Middle-out truncation: keep beginning and end, truncate middle
    if (finalUser.length > maxUserChars) {
      const keepStart = Math.floor(maxUserChars * 0.6)
      const keepEnd = Math.floor(maxUserChars * 0.3)
      const truncationNote = '\n\n[... Content truncated due to token limits - middle section removed ...]\n\n'
      
      finalUser = finalUser.substring(0, keepStart) + 
                 truncationNote + 
                 finalUser.substring(finalUser.length - keepEnd)
    }
  }
  
  const finalTokens = estimateTokens(finalSystem + finalUser)
  
  // Token clamping completed
  
  return {
    system: finalSystem,
    user: finalUser,
    estimated: finalTokens,
    clamped: true
  }
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
    let body: unknown
    try {
      body = await request.json()
    } catch (parseError) {
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

    // Validate required fields with proper typing
    const { apiKey, model, systemPrompt, userPrompt, options } = body as Record<string, unknown>

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_API_KEY',
            message: 'OpenRouter API key is required and must be a string'
          }
        },
        { status: 400 }
      )
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_MODEL',
            message: 'Model selection is required and must be a string'
          }
        },
        { status: 400 }
      )
    }

    if (!systemPrompt || typeof systemPrompt !== 'string' || !userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PROMPTS',
            message: 'Both system and user prompts are required and must be strings'
          }
        },
        { status: 400 }
      )
    }

    // Create OpenRouter client
    
    const client = new OpenRouterClient(apiKey)

    // Apply server-side token clamping with conservative context limit
    const assumedContextLimit = 32768 // Conservative limit that works across most models
    const maxOutput = (options as any)?.max_tokens ?? 8192
    
    // Preparing prompts for clamping
    
    const clamped = clampPrompts(systemPrompt, userPrompt, assumedContextLimit, maxOutput)
    
    // Server clamping applied

    // Generate completion with clamped prompts
    
    const completion = await client.generateCompletion(
      model,
      clamped.system,
      clamped.user,
      [], // Always empty - context is embedded in user prompt
      { ...options, max_tokens: maxOutput }
    )
    
    // OpenRouter API call successful

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

  } catch (error: unknown) {
    // Handle OpenRouter API errors
    const errorObj = error as { code?: string; message?: string; retryable?: boolean; status?: number }
    
    if (errorObj.code && errorObj.message) {
      const statusCode = getStatusCodeFromError(errorObj.code)
      
      // Extract more detailed error information if available
      const detailedMessage = (errorObj as any).message || errorObj.message
      const metadata = (errorObj as any).metadata
      
      // Returning OpenRouter error
      
      return NextResponse.json(
        {
          error: {
            code: errorObj.code,
            message: detailedMessage,
            retryable: errorObj.retryable || errorObj.code === 429,
            details: metadata?.raw || undefined
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
          retryable: true,
          debug: error instanceof Error ? error.message : String(error)
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