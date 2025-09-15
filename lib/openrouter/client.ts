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
  description?: string
  created?: number
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  top_provider?: {
    context_length?: number
    max_completion_tokens?: number
    popularity?: number
  }
  architecture?: {
    modality: string | string[]
    input_modalities?: string[]
    output_modalities?: string[]
    tokenizer?: string
    instruct_type?: string | null
  }
  supported_parameters?: string[]
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
    if (!response || !response.data) {
      throw new Error('Invalid response: missing data')
    }
    return response.data
  }

  async generateCompletion(request: OpenRouterCompletionRequest): Promise<OpenRouterCompletionResponse>
  async generateCompletion(
    model: string, 
    systemPrompt: string, 
    userPrompt: string, 
    contextFiles?: any[], 
    options?: any
  ): Promise<string>
  async generateCompletion(
    requestOrModel: OpenRouterCompletionRequest | string,
    systemPrompt?: string,
    userPrompt?: string,
    contextFiles?: any[],
    options?: any
  ): Promise<OpenRouterCompletionResponse | string> {
    // Handle the object-based call (original signature)
    if (typeof requestOrModel === 'object') {
      const request = requestOrModel as OpenRouterCompletionRequest
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

    // Handle the parameter-based call (for /api/generate route)
    const model = requestOrModel as string
    if (!model || !systemPrompt || !userPrompt) {
      throw new Error('Model, system prompt, and user prompt are required')
    }

    // Build messages array - userPrompt already includes context from buildUserPrompt()
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt } // userPrompt already includes context
    ]

    // NOTE: Context files are already included in userPrompt by buildUserPrompt()
    // No need to add them again here to avoid double-adding context

    const request: OpenRouterCompletionRequest = {
      model,
      messages,
      max_tokens: options?.max_tokens || 8192,
      temperature: options?.temperature || 0.3
    }

    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    // Return just the content string for the parameter-based call
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content
    }
    
    throw new Error('Invalid response format from OpenRouter API')
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

        if (!response || !response.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          
          // Retry on server errors
          if (response && response.status >= 500 && attempt < maxRetries) {
            attempt++
            await this.delay(Math.pow(2, attempt) * 1000)
            continue
          }

          // Retry on rate limiting
          if (response && response.status === 429 && attempt < maxRetries) {
            const retryAfter = response.headers.get('retry-after')
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
            attempt++
            await this.delay(delay)
            continue
          }

          throw new OpenRouterError(
            errorData.error?.message || (response ? `HTTP ${response.status}: ${response.statusText}` : 'Network error'),
            response?.status || 0,
            errorData.error?.code
          )
        }

        // Check if this is a streaming response
        const contentType = response.headers?.get?.('content-type')
        if (contentType && contentType.includes('text/event-stream')) {
          // For streaming responses, return the response object itself
          // The consumer will handle reading the stream
          return response
        }
        
        return await response.json()
      } catch (error) {
        if (error instanceof OpenRouterError) {
          throw error
        }
        
        // If this is a network error or timeout, and we have retries left
        if (attempt < maxRetries) {
          attempt++
          await this.delay(Math.pow(2, attempt) * 1000)
          continue
        }
        
        // Final attempt failed - throw the original error
        throw error
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}