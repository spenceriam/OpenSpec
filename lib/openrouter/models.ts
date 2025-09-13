import { OpenRouterClient } from './client'

export interface ModelCapabilities {
  hasVision: boolean
  supportsStreaming: boolean
  maxContextLength: number
}

export interface FormattedModelInfo {
  displayName: string
  provider: string
  costPer1k: number
}

export async function listAvailableModels(): Promise<any[]> {
  // This would normally use the OpenRouter client to fetch models
  // For now, return empty array as placeholder
  return []
}

export function getModelCapabilities(model: any): ModelCapabilities {
  return {
    hasVision: model.architecture?.modality?.includes('image') || false,
    supportsStreaming: true, // Most models support streaming
    maxContextLength: model.context_length || 4096
  }
}

export function formatModelInfo(model: any): FormattedModelInfo {
  return {
    displayName: model.name || model.id,
    provider: model.id?.split('/')[0] || 'unknown',
    costPer1k: parseFloat(model.pricing?.prompt || '0') * 1000
  }
}