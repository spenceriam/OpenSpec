// Main client
export { OpenRouterClient } from './client'

// Types and constants
export * from './types'

// Utility functions
export * from './utils'

// Re-export commonly used types from main types file
export type {
  OpenRouterModel,
  GenerateCompletionRequest,
  GenerateCompletionResponse,
  GetModelsResponse,
  ModelFilter,
  ModelSearchResult
} from '@/types'