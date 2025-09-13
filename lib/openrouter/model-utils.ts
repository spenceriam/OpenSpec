import { OpenRouterModel } from '@/types'

export interface ModelFilters {
  capability?: 'vision' | 'reasoning' | 'coding' | 'all'
  priceRange?: {
    min?: number
    max?: number
  }
  contextLength?: {
    min?: number
    max?: number
  }
  provider?: string
}

/**
 * Filter models based on various criteria
 */
export function filterModels(models: OpenRouterModel[], filters: ModelFilters): OpenRouterModel[] {
  return models.filter(model => {
    // Filter by capability
    if (filters.capability && filters.capability !== 'all') {
      switch (filters.capability) {
        case 'vision':
          if (!model.architecture?.modality?.includes('vision')) {
            return false
          }
          break
        case 'reasoning':
          if (!model.name.toLowerCase().includes('reasoning') && 
              !model.description?.toLowerCase().includes('reasoning')) {
            return false
          }
          break
        case 'coding':
          if (!model.name.toLowerCase().includes('code') && 
              !model.description?.toLowerCase().includes('code')) {
            return false
          }
          break
      }
    }

    // Filter by price range
    if (filters.priceRange && model.pricing) {
      const price = model.pricing.prompt || 0
      if (filters.priceRange.min !== undefined && price < filters.priceRange.min) {
        return false
      }
      if (filters.priceRange.max !== undefined && price > filters.priceRange.max) {
        return false
      }
    }

    // Filter by context length
    if (filters.contextLength && model.context_length) {
      if (filters.contextLength.min !== undefined && model.context_length < filters.contextLength.min) {
        return false
      }
      if (filters.contextLength.max !== undefined && model.context_length > filters.contextLength.max) {
        return false
      }
    }

    // Filter by provider
    if (filters.provider && filters.provider !== 'all') {
      if (!model.top_provider?.provider_name?.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false
      }
    }

    return true
  })
}

/**
 * Search models by name, description, or provider
 */
export function searchModels(models: OpenRouterModel[], query: string): OpenRouterModel[] {
  if (!query.trim()) {
    return models
  }

  const searchTerm = query.toLowerCase().trim()
  
  return models.filter(model => 
    model.name.toLowerCase().includes(searchTerm) ||
    model.description?.toLowerCase().includes(searchTerm) ||
    model.top_provider?.provider_name?.toLowerCase().includes(searchTerm) ||
    model.id.toLowerCase().includes(searchTerm)
  )
}

/**
 * Categorize models by provider or type
 */
export function categorizeModels(models: OpenRouterModel[]): Record<string, OpenRouterModel[]> {
  const categories: Record<string, OpenRouterModel[]> = {}

  models.forEach(model => {
    // Categorize by provider
    const provider = model.top_provider?.provider_name || 'Unknown'
    
    if (!categories[provider]) {
      categories[provider] = []
    }
    categories[provider].push(model)

    // Also categorize by model family
    const modelFamily = extractModelFamily(model.name)
    if (modelFamily && modelFamily !== provider) {
      if (!categories[modelFamily]) {
        categories[modelFamily] = []
      }
      if (!categories[modelFamily].includes(model)) {
        categories[modelFamily].push(model)
      }
    }
  })

  return categories
}

/**
 * Extract model family from model name (e.g., "GPT-4" from "gpt-4-turbo")
 */
function extractModelFamily(modelName: string): string {
  const name = modelName.toLowerCase()
  
  if (name.includes('gpt')) {
    if (name.includes('gpt-4')) return 'GPT-4'
    if (name.includes('gpt-3')) return 'GPT-3.5'
    return 'GPT'
  }
  
  if (name.includes('claude')) {
    if (name.includes('claude-3')) return 'Claude 3'
    if (name.includes('claude-2')) return 'Claude 2'
    return 'Claude'
  }
  
  if (name.includes('gemini')) return 'Gemini'
  if (name.includes('llama')) return 'Llama'
  if (name.includes('mistral')) return 'Mistral'
  if (name.includes('mixtral')) return 'Mixtral'
  if (name.includes('qwen')) return 'Qwen'
  if (name.includes('deepseek')) return 'DeepSeek'
  if (name.includes('yi-')) return 'Yi'
  
  return 'Other'
}

/**
 * Format price for display
 */
export function formatPrice(price?: number): string {
  if (!price || price === 0) {
    return 'Free'
  }

  if (price < 0.001) {
    return `$${(price * 1000000).toFixed(2)}M`
  }

  if (price < 1) {
    return `$${(price * 1000).toFixed(2)}K`
  }

  return `$${price.toFixed(2)}`
}

/**
 * Get popular models (models with high popularity scores)
 */
export function getPopularModels(models: OpenRouterModel[], limit = 10): OpenRouterModel[] {
  return models
    .filter(model => (model.top_provider?.popularity || 0) > 50)
    .sort((a, b) => (b.top_provider?.popularity || 0) - (a.top_provider?.popularity || 0))
    .slice(0, limit)
}

/**
 * Get recommended models for specific use cases
 */
export function getRecommendedModels(
  models: OpenRouterModel[], 
  useCase: 'general' | 'coding' | 'reasoning' | 'vision' | 'fast' | 'cheap'
): OpenRouterModel[] {
  let filtered = [...models]

  switch (useCase) {
    case 'coding':
      filtered = filterModels(models, { capability: 'coding' })
      break
    case 'reasoning':
      filtered = filterModels(models, { capability: 'reasoning' })
      break
    case 'vision':
      filtered = filterModels(models, { capability: 'vision' })
      break
    case 'fast':
      // Prefer models with lower context length (typically faster)
      filtered = models.filter(m => (m.context_length || 0) < 16000)
      break
    case 'cheap':
      // Prefer models with lower pricing
      filtered = models.filter(m => (m.pricing?.prompt || 0) < 0.01)
      break
    case 'general':
    default:
      // Return popular, well-rounded models
      filtered = getPopularModels(models, 20)
      break
  }

  // Sort by popularity as secondary criteria
  return filtered.sort((a, b) => 
    (b.top_provider?.popularity || 0) - (a.top_provider?.popularity || 0)
  )
}

/**
 * Compare two models
 */
export function compareModels(modelA: OpenRouterModel, modelB: OpenRouterModel) {
  return {
    pricing: {
      a: modelA.pricing?.prompt || 0,
      b: modelB.pricing?.prompt || 0,
      winner: (modelA.pricing?.prompt || 0) < (modelB.pricing?.prompt || 0) ? 'a' : 'b'
    },
    contextLength: {
      a: modelA.context_length || 0,
      b: modelB.context_length || 0,
      winner: (modelA.context_length || 0) > (modelB.context_length || 0) ? 'a' : 'b'
    },
    popularity: {
      a: modelA.top_provider?.popularity || 0,
      b: modelB.top_provider?.popularity || 0,
      winner: (modelA.top_provider?.popularity || 0) > (modelB.top_provider?.popularity || 0) ? 'a' : 'b'
    }
  }
}