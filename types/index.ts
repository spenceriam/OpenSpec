// Core workflow types
export type WorkflowPhase = 'requirements' | 'design' | 'tasks' | 'complete'

// Specification state interface
export interface SpecState {
  phase: WorkflowPhase
  featureName: string
  description: string
  requirements: string
  design: string
  tasks: string
  context: ContextFile[]
  isGenerating: boolean
  error: string | null
  approvals: ApprovalState
}

// OpenRouter model interface
export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  top_provider: {
    context_length: number
    max_completion_tokens: number
  }
  architecture: {
    modality: string
    tokenizer: string
    instruct_type: string
  }
  per_request_limits?: {
    prompt_tokens: string
    completion_tokens: string
  }
}

// API request/response types for OpenRouter integration
export interface GenerateCompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{
      type: 'text' | 'image_url'
      text?: string
      image_url?: {
        url: string
        detail?: 'low' | 'high' | 'auto'
      }
    }>
  }>
  max_tokens?: number
  temperature?: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  presence_penalty?: number
  repetition_penalty?: number
  min_p?: number
  top_a?: number
  seed?: number
  logit_bias?: Record<string, number>
  logprobs?: boolean
  top_logprobs?: number
  response_format?: {
    type: 'text' | 'json_object'
    schema?: object
  }
  stop?: string | string[]
  stream?: boolean
}

export interface GenerateCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GetModelsResponse {
  object: string
  data: OpenRouterModel[]
}

// Context file interface for file uploads
export interface ContextFile {
  id: string
  name: string
  type: 'text' | 'image' | 'document' | 'code'
  content: string
  size: number
  lastModified: number
  mimeType: string
}

// Approval state for workflow phases
export interface ApprovalState {
  requirements: boolean
  design: boolean
  tasks: boolean
}

// Export options interface
export interface ExportOptions {
  format: 'markdown' | 'separate' | 'diagrams' | 'combined'
  includeMetadata: boolean
  includeDiagrams: boolean
  includeTimestamp: boolean
}

// Export data interface
export interface ExportData {
  featureName: string
  requirements: string
  design: string
  tasks: string
  diagrams: string[]
  metadata: {
    generatedAt: string
    model: string
    version: string
  }
}

// Error handling types
export interface APIError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Storage types
export interface StorageInfo {
  used: number
  available: number
  quota: number
  percentUsed: number
}

export interface SessionData {
  apiKey: string
  selectedModel: string
  lastActivity: number
}

// Refinement types
export interface RefinementRequest {
  phase: WorkflowPhase
  currentContent: string
  feedback: string
  timestamp: number
}

export interface RefinementHistory {
  phase: WorkflowPhase
  versions: Array<{
    content: string
    timestamp: number
    feedback?: string
  }>
}

// Model filtering and search types
export interface ModelFilter {
  hasVision: boolean
  minContextLength: number
  maxPricing: number
  architecture?: string[]
  provider?: string[]
}

export interface ModelSearchResult {
  model: OpenRouterModel
  score: number
  matchedFields: string[]
}

// Diagram types
export interface DiagramInfo {
  id: string
  type: 'architecture' | 'sequence' | 'erd' | 'userflow' | 'state'
  title: string
  content: string
  svg?: string
}

export interface DiagramExportOptions {
  format: 'svg' | 'mermaid' | 'both'
  includeTitle: boolean
  theme: 'default' | 'dark' | 'light'
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  progress?: number
  message?: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}