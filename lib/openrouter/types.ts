import { OpenRouterModel, ModelFilter, ModelSearchResult } from '@/types'

// Common model IDs for quick access
export const POPULAR_MODELS = {
  GPT_4O: 'openai/gpt-4o',
  CLAUDE_3_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro',
  MISTRAL_LARGE: 'mistralai/mistral-large',
  LLAMA_3_70B: 'meta-llama/llama-3-70b-instruct'
} as const

// Model capabilities
export interface ModelCapabilities {
  supportsVision: boolean
  supportsCode: boolean
  supportsReasoning: boolean
  maxContextLength: number
  costPerMToken: number
}

// Rate limiting constants
export const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  RETRY_DELAY: 1000, // 1 second base delay
  MAX_RETRIES: 3
} as const

// Error codes
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  CONTEXT_TOO_LONG: 'CONTEXT_TOO_LONG',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// Default model filter
export const DEFAULT_MODEL_FILTER: ModelFilter = {
  hasVision: false,
  minContextLength: 4000,
  maxPricing: 100, // $100 per 1M tokens
  architecture: undefined,
  provider: undefined
}

// Model categories for organization
export const MODEL_CATEGORIES = {
  FLAGSHIP: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro'],
  CODING: ['claude-3.5-sonnet', 'gpt-4o', 'deepseek-coder'],
  VISION: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro-vision'],
  FAST: ['claude-3-haiku', 'gpt-3.5-turbo', 'gemini-flash'],
  ECONOMICAL: ['claude-3-haiku', 'llama-3-8b', 'mistral-7b']
} as const

// Utility functions
export function getModelCategory(model: OpenRouterModel): string[] {
  const categories: string[] = []
  const modelId = model.id.toLowerCase()
  
  Object.entries(MODEL_CATEGORIES).forEach(([category, models]) => {
    if (models.some(m => modelId.includes(m.toLowerCase()))) {
      categories.push(category.toLowerCase())
    }
  })
  
  return categories
}

export function isPopularModel(modelId: string): boolean {
  return Object.values(POPULAR_MODELS).includes(modelId as any)
}

export function getCostTier(model: OpenRouterModel): 'free' | 'low' | 'medium' | 'high' | 'premium' {
  try {
    const promptPrice = parseFloat(model.pricing.prompt) * 1000000 // Per 1M tokens
    
    if (promptPrice === 0) return 'free'
    if (promptPrice < 1) return 'low'
    if (promptPrice < 10) return 'medium'
    if (promptPrice < 50) return 'high'
    return 'premium'
  } catch {
    return 'medium'
  }
}