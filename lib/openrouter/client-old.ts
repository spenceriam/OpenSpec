import { OpenRouterError } from './errors'

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OpenRouterCompletionRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

export interface OpenRouterCompletionResponse {
  id: string
  model: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenRouterModel {
  id: string
  name: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  architecture?: {
    modality: string
  }
}

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required')
    }
    this.apiKey = apiKey
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.listModels()
      return true
    } catch {
      return false
    }
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const response = await this.makeRequest('/models')
    return response.data
  }

  async generateCompletion(request: OpenRouterCompletionRequest): Promise<OpenRouterCompletionResponse> {
    if (!request.model) {
      throw new Error('Model is required')
    }
    
    if (!request.messages || request.messages.length === 0) {
      throw new Error('Messages are required')
    }

    return this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.method === 'POST' && {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
        'X-Title': 'OpenSpec',
      }),
    }

    let attempt = 0
    const maxRetries = 3

    while (attempt <= maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          
          // Retry on server errors
          if (response.status >= 500 && attempt < maxRetries) {
            attempt++
            await this.delay(Math.pow(2, attempt) * 1000)
            continue
          }

          // Retry on rate limiting
          if (response.status === 429 && attempt < maxRetries) {
            const retryAfter = response.headers.get('retry-after')
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
            attempt++
            await this.delay(delay)
            continue
          }

          throw new OpenRouterError(
            errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.error?.code
          )
        }

        return await response.json()
      } catch (error) {
        if (error instanceof OpenRouterError) {
          throw error
        }
        
        if (attempt < maxRetries) {
          attempt++
          await this.delay(Math.pow(2, attempt) * 1000)
          continue
        }
        
        throw error
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
      retryable: this.isRetryableStatus(response.status)
    }

    return error
  }

  /**
   * Wrap generic errors as APIError
   */
  private wrapError(error: Error): APIError {
    return {
      code: 'CLIENT_ERROR',
      message: error.message,
      details: { originalError: error.name },
      retryable: false
    }
  }

  /**
   * Determine if HTTP status is retryable
   */
  private isRetryableStatus(status: number): boolean {
    return status >= 500 || status === 429 || status === 408
  }

  /**
   * Get model capabilities
   */
  hasVisionSupport(model: OpenRouterModel): boolean {
    return model.architecture?.modality?.includes('multimodal') || 
           model.architecture?.modality?.includes('vision') ||
           model.name.toLowerCase().includes('vision') ||
           model.id.toLowerCase().includes('vision')
  }

  /**
   * Format pricing for display
   */
  formatPricing(model: OpenRouterModel): string {
    try {
      const promptPrice = parseFloat(model.pricing.prompt) * 1000000 // Convert to per-1M tokens
      const completionPrice = parseFloat(model.pricing.completion) * 1000000
      
      if (promptPrice < 1) {
        return `$${(promptPrice * 1000).toFixed(2)}/1K prompt, $${(completionPrice * 1000).toFixed(2)}/1K completion`
      }
      
      return `$${promptPrice.toFixed(2)}/1M prompt, $${completionPrice.toFixed(2)}/1M completion`
    } catch (error) {
      return 'Pricing unavailable'
    }
  }

  /**
   * Format context length for display
   */
  formatContextLength(contextLength: number): string {
    if (contextLength >= 1000000) {
      return `${(contextLength / 1000000).toFixed(1)}M tokens`
    } else if (contextLength >= 1000) {
      return `${(contextLength / 1000).toFixed(0)}K tokens`
    }
    return `${contextLength} tokens`
  }
}