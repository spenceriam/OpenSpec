import {
  GenerateCompletionRequest,
  GenerateCompletionResponse,
  GetModelsResponse,
  OpenRouterModel,
  APIError,
  ContextFile
} from '@/types'

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private defaultHeaders: Record<string, string>

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.defaultHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://openspec.dev',
      'X-Title': 'OpenSpec - Open Source Kiro Spec Mode'
    }
  }

  /**
   * Generate completion using OpenRouter API
   */
  async generateCompletion(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    contextFiles?: ContextFile[],
    options?: Partial<GenerateCompletionRequest>
  ): Promise<string> {
    try {
      const messages = this.buildMessages(systemPrompt, userPrompt, contextFiles)
      
      const request: GenerateCompletionRequest = {
        model,
        messages,
        temperature: 0.3,
        max_tokens: 8192,
        stream: false,
        ...options
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw await this.handleAPIError(response)
      }

      const data: GenerateCompletionResponse = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No completion choices returned from API')
      }

      return data.choices[0].message.content
    } catch (error) {
      if (error instanceof Error) {
        throw this.wrapError(error)
      }
      throw new Error('Unknown error occurred during completion generation')
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': this.defaultHeaders.Authorization,
          'HTTP-Referer': this.defaultHeaders['HTTP-Referer'],
          'X-Title': this.defaultHeaders['X-Title']
        }
      })

      if (!response.ok) {
        throw await this.handleAPIError(response)
      }

      const data: GetModelsResponse = await response.json()
      return data.data || []
    } catch (error) {
      if (error instanceof Error) {
        throw this.wrapError(error)
      }
      throw new Error('Unknown error occurred while fetching models')
    }
  }

  /**
   * Test API key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      const models = await this.getAvailableModels()
      return models.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Get estimated cost for a completion request
   */
  getEstimatedCost(
    model: OpenRouterModel,
    promptTokens: number,
    completionTokens: number = 1000
  ): number {
    try {
      const promptCost = parseFloat(model.pricing.prompt) * (promptTokens / 1000000)
      const completionCost = parseFloat(model.pricing.completion) * (completionTokens / 1000000)
      return promptCost + completionCost
    } catch (error) {
      return 0
    }
  }

  /**
   * Build messages array for API request
   */
  private buildMessages(
    systemPrompt: string,
    userPrompt: string,
    contextFiles?: ContextFile[]
  ): GenerateCompletionRequest['messages'] {
    const messages: GenerateCompletionRequest['messages'] = [
      { role: 'system', content: systemPrompt }
    ]

    if (contextFiles && contextFiles.length > 0) {
      const hasImages = contextFiles.some(file => file.type === 'image')
      
      if (hasImages) {
        // Use multimodal content format for vision models
        const contentParts: Array<{
          type: 'text' | 'image_url'
          text?: string
          image_url?: { url: string; detail?: 'low' | 'high' | 'auto' }
        }> = [{ type: 'text', text: userPrompt }]

        contextFiles.forEach(file => {
          if (file.type === 'image') {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: file.content,
                detail: 'high'
              }
            })
          } else {
            contentParts[0].text += `\n\n## ${file.name}:\n${file.content}`
          }
        })

        messages.push({ role: 'user', content: contentParts })
      } else {
        // Text-only content
        let combinedPrompt = userPrompt
        
        contextFiles.forEach(file => {
          combinedPrompt += `\n\n## Context File: ${file.name}\n${file.content}`
        })

        messages.push({ role: 'user', content: combinedPrompt })
      }
    } else {
      messages.push({ role: 'user', content: userPrompt })
    }

    return messages
  }

  /**
   * Handle API errors and convert to APIError
   */
  private async handleAPIError(response: Response): Promise<APIError> {
    let errorData: any = {}
    
    try {
      errorData = await response.json()
    } catch {
      // If JSON parsing fails, use status text
      errorData = { message: response.statusText }
    }

    const error: APIError = {
      code: `HTTP_${response.status}`,
      message: errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      details: errorData,
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