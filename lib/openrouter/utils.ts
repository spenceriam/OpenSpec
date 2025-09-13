import { 
  OpenRouterModel, 
  ModelFilter, 
  ModelSearchResult 
} from '@/types'
import { 
  POPULAR_MODELS, 
  MODEL_CATEGORIES, 
  DEFAULT_MODEL_FILTER,
  getModelCategory,
  isPopularModel,
  getCostTier
} from './types'

/**
 * Filter models based on criteria
 */
export function filterModels(
  models: OpenRouterModel[],
  filter: Partial<ModelFilter> = {}
): OpenRouterModel[] {
  const appliedFilter = { ...DEFAULT_MODEL_FILTER, ...filter }

  return models.filter(model => {
    // Vision support filter
    if (appliedFilter.hasVision && !hasVisionSupport(model)) {
      return false
    }

    // Context length filter
    if (model.context_length < appliedFilter.minContextLength) {
      return false
    }

    // Pricing filter
    const pricing = getModelPricing(model)
    if (pricing > appliedFilter.maxPricing) {
      return false
    }

    // Architecture filter
    if (appliedFilter.architecture && appliedFilter.architecture.length > 0) {
      const hasMatchingArchitecture = appliedFilter.architecture.some(arch =>
        model.architecture?.tokenizer?.toLowerCase().includes(arch.toLowerCase()) ||
        model.architecture?.modality?.toLowerCase().includes(arch.toLowerCase())
      )
      if (!hasMatchingArchitecture) {
        return false
      }
    }

    // Provider filter
    if (appliedFilter.provider && appliedFilter.provider.length > 0) {
      const provider = getModelProvider(model)
      if (!appliedFilter.provider.includes(provider)) {
        return false
      }
    }

    return true
  })
}

/**
 * Search models by name, description, or capabilities
 */
export function searchModels(
  models: OpenRouterModel[],
  query: string,
  maxResults: number = 20
): ModelSearchResult[] {
  if (!query.trim()) {
    return models.slice(0, maxResults).map(model => ({
      model,
      score: 1,
      matchedFields: []
    }))
  }

  const queryLower = query.toLowerCase()
  const results: ModelSearchResult[] = []

  models.forEach(model => {
    const matchedFields: string[] = []
    let score = 0

    // Exact ID match (highest priority)
    if (model.id.toLowerCase() === queryLower) {
      score += 100
      matchedFields.push('id')
    }

    // Exact name match
    if (model.name.toLowerCase() === queryLower) {
      score += 90
      matchedFields.push('name')
    }

    // ID contains query
    if (model.id.toLowerCase().includes(queryLower)) {
      score += 20
      if (!matchedFields.includes('id')) matchedFields.push('id')
    }

    // Name contains query
    if (model.name.toLowerCase().includes(queryLower)) {
      score += 15
      if (!matchedFields.includes('name')) matchedFields.push('name')
    }

    // Description contains query
    if (model.description?.toLowerCase().includes(queryLower)) {
      score += 10
      matchedFields.push('description')
    }

    // Provider match
    const provider = getModelProvider(model)
    if (provider.toLowerCase().includes(queryLower)) {
      score += 8
      matchedFields.push('provider')
    }

    // Architecture matches
    if (model.architecture?.modality?.toLowerCase().includes(queryLower) ||
        model.architecture?.tokenizer?.toLowerCase().includes(queryLower)) {
      score += 5
      matchedFields.push('architecture')
    }

    // Capability matches
    if (queryLower.includes('vision') && hasVisionSupport(model)) {
      score += 15
      matchedFields.push('vision')
    }

    if (queryLower.includes('code') || queryLower.includes('coding')) {
      const categories = getModelCategory(model)
      if (categories.includes('coding')) {
        score += 10
        matchedFields.push('coding')
      }
    }

    // Popular model boost
    if (isPopularModel(model.id)) {
      score += 5
    }

    // Only include models with some relevance
    if (score > 0) {
      results.push({ model, score, matchedFields })
    }
  })

  // Sort by score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

/**
 * Group models by provider
 */
export function groupModelsByProvider(models: OpenRouterModel[]): Record<string, OpenRouterModel[]> {
  const grouped: Record<string, OpenRouterModel[]> = {}

  models.forEach(model => {
    const provider = getModelProvider(model)
    if (!grouped[provider]) {
      grouped[provider] = []
    }
    grouped[provider].push(model)
  })

  // Sort models within each provider
  Object.keys(grouped).forEach(provider => {
    grouped[provider].sort((a, b) => {
      // Popular models first
      const aPopular = isPopularModel(a.id)
      const bPopular = isPopularModel(b.id)
      
      if (aPopular && !bPopular) return -1
      if (!aPopular && bPopular) return 1
      
      // Then by name
      return a.name.localeCompare(b.name)
    })
  })

  return grouped
}

/**
 * Get model provider from ID
 */
export function getModelProvider(model: OpenRouterModel): string {
  const provider = model.id.split('/')[0]
  
  // Normalize provider names
  const providerMap: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'mistralai': 'Mistral AI',
    'meta-llama': 'Meta',
    'microsoft': 'Microsoft',
    'cohere': 'Cohere',
    'huggingface': 'Hugging Face',
    'together': 'Together AI'
  }

  return providerMap[provider] || provider
}

/**
 * Check if model supports vision/multimodal input
 */
export function hasVisionSupport(model: OpenRouterModel): boolean {
  // Check architecture modality
  if (model.architecture?.modality) {
    const modality = model.architecture.modality.toLowerCase()
    if (modality.includes('multimodal') || 
        modality.includes('vision') || 
        modality.includes('image')) {
      return true
    }
  }

  // Check model name/ID for vision indicators
  const nameAndId = `${model.name} ${model.id}`.toLowerCase()
  return nameAndId.includes('vision') || 
         nameAndId.includes('multimodal') ||
         nameAndId.includes('4o') || // GPT-4o has vision
         nameAndId.includes('claude-3') // Claude-3 models have vision
}

/**
 * Get model pricing per 1M tokens (prompt cost)
 */
export function getModelPricing(model: OpenRouterModel): number {
  try {
    return parseFloat(model.pricing.prompt) * 1000000
  } catch {
    return 0
  }
}

/**
 * Format model context length for display
 */
export function formatContextLength(contextLength: number): string {
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M tokens`
  } else if (contextLength >= 1000) {
    return `${Math.round(contextLength / 1000)}K tokens`
  }
  return `${contextLength} tokens`
}

/**
 * Format pricing for display
 */
export function formatPricing(model: OpenRouterModel): {
  prompt: string
  completion: string
  display: string
} {
  try {
    const promptPrice = parseFloat(model.pricing.prompt) * 1000000
    const completionPrice = parseFloat(model.pricing.completion) * 1000000
    
    if (promptPrice === 0 && completionPrice === 0) {
      return {
        prompt: 'Free',
        completion: 'Free',
        display: 'Free'
      }
    }
    
    if (promptPrice < 1) {
      return {
        prompt: `$${(promptPrice * 1000).toFixed(2)}/1K`,
        completion: `$${(completionPrice * 1000).toFixed(2)}/1K`,
        display: `$${(promptPrice * 1000).toFixed(2)}/$${(completionPrice * 1000).toFixed(2)} per 1K`
      }
    }
    
    return {
      prompt: `$${promptPrice.toFixed(2)}/1M`,
      completion: `$${completionPrice.toFixed(2)}/1M`,
      display: `$${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per 1M`
    }
  } catch (error) {
    return {
      prompt: 'Unknown',
      completion: 'Unknown',
      display: 'Pricing unavailable'
    }
  }
}

/**
 * Get model capabilities summary
 */
export interface ModelCapabilities {
  hasVision: boolean
  contextLength: number
  costTier: 'free' | 'low' | 'medium' | 'high' | 'premium'
  categories: string[]
  provider: string
  isPopular: boolean
}

export function getModelCapabilities(model: OpenRouterModel): ModelCapabilities {
  return {
    hasVision: hasVisionSupport(model),
    contextLength: model.context_length,
    costTier: getCostTier(model),
    categories: getModelCategory(model),
    provider: getModelProvider(model),
    isPopular: isPopularModel(model.id)
  }
}

/**
 * Sort models by relevance for spec generation
 */
export function sortModelsForSpecGeneration(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.sort((a, b) => {
    // Get capabilities
    const aCap = getModelCapabilities(a)
    const bCap = getModelCapabilities(b)
    
    // Popular models first
    if (aCap.isPopular && !bCap.isPopular) return -1
    if (!aCap.isPopular && bCap.isPopular) return 1
    
    // Coding-capable models preferred for spec generation
    const aCoding = aCap.categories.includes('coding')
    const bCoding = bCap.categories.includes('coding')
    
    if (aCoding && !bCoding) return -1
    if (!aCoding && bCoding) return 1
    
    // Higher context length preferred
    if (aCap.contextLength !== bCap.contextLength) {
      return bCap.contextLength - aCap.contextLength
    }
    
    // Lower cost preferred for similar capabilities
    const aCost = getModelPricing(a)
    const bCost = getModelPricing(b)
    
    return aCost - bCost
  })
}

/**
 * Get recommended models for different use cases
 */
export function getRecommendedModels(models: OpenRouterModel[]): {
  flagship: OpenRouterModel[]
  coding: OpenRouterModel[]
  vision: OpenRouterModel[]
  economical: OpenRouterModel[]
  fast: OpenRouterModel[]
} {
  const flagship = models.filter(m => getModelCapabilities(m).isPopular).slice(0, 3)
  const coding = models.filter(m => getModelCapabilities(m).categories.includes('coding')).slice(0, 5)
  const vision = models.filter(m => hasVisionSupport(m)).slice(0, 5)
  const economical = models
    .filter(m => getCostTier(m) === 'low' || getCostTier(m) === 'free')
    .slice(0, 5)
  const fast = models
    .filter(m => getModelCapabilities(m).categories.includes('fast'))
    .slice(0, 5)

  return {
    flagship: sortModelsForSpecGeneration(flagship),
    coding: sortModelsForSpecGeneration(coding),
    vision: sortModelsForSpecGeneration(vision),
    economical: sortModelsForSpecGeneration(economical),
    fast: sortModelsForSpecGeneration(fast)
  }
}