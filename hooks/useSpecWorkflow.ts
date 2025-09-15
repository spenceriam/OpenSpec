'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  SpecState, 
  WorkflowPhase, 
  ApprovalState, 
  ContextFile, 
  RefinementRequest,
  RefinementHistory 
} from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { useSimpleApiKeyStorage } from './useSimpleApiKeyStorage'

const DEFAULT_SPEC_STATE: SpecState = {
  phase: 'requirements',
  featureName: '',
  description: '',
  requirements: '',
  design: '',
  tasks: '',
  context: [],
  isGenerating: false,
  error: null,
  approvals: {
    requirements: false,
    design: false,
    tasks: false
  }
}

export interface UseSpecWorkflowOptions {
  autoSave?: boolean
  selectedModel?: { id: string; name: string } | null
  onPhaseChange?: (newPhase: WorkflowPhase, oldPhase: WorkflowPhase) => void
  onGenerationStart?: (phase: WorkflowPhase) => void
  onGenerationComplete?: (phase: WorkflowPhase, content: string) => void
  onError?: (error: Error, phase: WorkflowPhase) => void
}

export interface UseSpecWorkflowReturn {
  // State
  state: SpecState
  refinementHistory: RefinementHistory[]
  
  // Phase management
  currentPhase: WorkflowPhase
  canProceedToNext: boolean
  canGoBack: boolean
  nextPhase: WorkflowPhase | null
  previousPhase: WorkflowPhase | null
  
  // Basic actions
  setFeatureName: (name: string) => void
  setDescription: (description: string) => void
  addContextFile: (file: ContextFile) => void
  removeContextFile: (fileId: string) => void
  clearContext: () => void
  
  // Generation actions
  generateCurrentPhase: () => Promise<void>
  generateWithData: (featureName: string, description: string, contextFiles: ContextFile[]) => Promise<void>
  refineCurrentPhase: (feedback: string) => Promise<void>
  
  // Approval and progression
  approveCurrentPhase: () => void
  rejectCurrentPhase: () => void
  proceedToNextPhase: () => void
  goToPreviousPhase: () => void
  
  // Content management
  updatePhaseContent: (phase: WorkflowPhase, content: string) => void
  getPhaseContent: (phase: WorkflowPhase) => string
  
  // Utility actions
  reset: () => void
  clearError: () => void
  exportData: () => any
  importData: (data: any) => boolean
  forceSync: () => void
  
  // Test-compatible API aliases and additional methods
  generateContent: (phase: WorkflowPhase, prompt: string, model: string) => Promise<void>
  refineContent: (phase: WorkflowPhase, feedback: string, model: string) => Promise<void>
  setCurrentPhase: (phase: WorkflowPhase) => void
  updateApproval: (phase: WorkflowPhase, status: 'approved' | 'pending') => void
  progressToNextPhase: () => void
  resetWorkflow: () => void
  setError: (message: string) => void
  canProgressToNextPhase: () => boolean
  isWorkflowComplete: () => boolean
  isGenerating: boolean
  error: string | null
  phaseContent: {
    requirements: string
    design: string
    tasks: string
  }
  approvals: {
    requirements: 'approved' | 'pending'
    design: 'approved' | 'pending'
    tasks: 'approved' | 'pending'
  }
}

export function useSpecWorkflow(options: UseSpecWorkflowOptions = {}): UseSpecWorkflowReturn {
  const {
    autoSave = true,
    selectedModel,
    onPhaseChange,
    onGenerationStart,
    onGenerationComplete,
    onError
  } = options

  // API key management
  const { value: apiKey, hasValidKey } = useSimpleApiKeyStorage()

  // Persistent state management
  const {
    value: state,
    setValue: setState,
    error: storageError,
    forceSync
  } = useLocalStorage('openspec-workflow-state', {
    defaultValue: DEFAULT_SPEC_STATE,
    autoSave,
    validateData: (data): data is SpecState => {
      return (
        typeof data === 'object' &&
        data !== null &&
        'phase' in data &&
        'featureName' in data &&
        'description' in data &&
        'approvals' in data
      )
    }
  })

  // Refinement history
  const [refinementHistory, setRefinementHistory] = useState<RefinementHistory[]>([])
  
  // Track previous phase for callbacks
  const previousPhaseRef = useRef<WorkflowPhase>(state.phase)

  // Phase progression logic
  const phases: WorkflowPhase[] = ['requirements', 'design', 'tasks', 'complete']
  const currentPhaseIndex = phases.indexOf(state.phase)
  
  const nextPhase: WorkflowPhase | null = 
    currentPhaseIndex < phases.length - 1 ? phases[currentPhaseIndex + 1] : null
  
  const previousPhase: WorkflowPhase | null = 
    currentPhaseIndex > 0 ? phases[currentPhaseIndex - 1] : null

  const canProceedToNext = Boolean(
    nextPhase && 
    state.approvals[state.phase as keyof ApprovalState] &&
    !state.isGenerating
  )

  const canGoBack = Boolean(previousPhase && !state.isGenerating)

  // Basic setters
  const setFeatureName = useCallback((name: string) => {
    console.log('=== WORKFLOW setFeatureName CALLED ===', {
      name: name.trim(),
      currentState: state.featureName
    })
    setState(prev => {
      console.log('=== WORKFLOW setState for featureName ===', {
        prevState: prev.featureName,
        newState: name.trim()
      })
      return { ...prev, featureName: name.trim() }
    })
  }, [setState, state.featureName])

  const setDescription = useCallback((description: string) => {
    console.log('=== WORKFLOW setDescription CALLED ===', {
      description: description.substring(0, 100) + '...',
      currentState: state.description?.substring(0, 100) + '...' || 'EMPTY'
    })
    setState(prev => {
      console.log('=== WORKFLOW setState for description ===', {
        prevState: prev.description?.substring(0, 50) + '...' || 'EMPTY',
        newState: description.substring(0, 50) + '...'
      })
      return { ...prev, description }
    })
  }, [setState, state.description])

  // Context file management
  const addContextFile = useCallback((file: ContextFile) => {
    console.log('=== WORKFLOW addContextFile CALLED ===', {
      fileName: file.name,
      fileType: file.type,
      currentContextLength: state.context.length
    })
    setState(prev => {
      const newContext = [...prev.context.filter(f => f.id !== file.id), file]
      console.log('=== WORKFLOW setState for addContextFile ===', {
        prevContextLength: prev.context.length,
        newContextLength: newContext.length,
        fileAdded: file.name
      })
      return {
        ...prev,
        context: newContext
      }
    })
  }, [setState, state.context.length])

  const removeContextFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      context: prev.context.filter(f => f.id !== fileId)
    }))
  }, [setState])

  const clearContext = useCallback(() => {
    console.log('=== WORKFLOW clearContext CALLED ===', {
      currentContextLength: state.context.length
    })
    setState(prev => {
      console.log('=== WORKFLOW setState for clearContext ===', {
        prevContextLength: prev.context.length,
        newContextLength: 0
      })
      return { ...prev, context: [] }
    })
  }, [setState, state.context.length])

  // Content management
  const updatePhaseContent = useCallback((phase: WorkflowPhase, content: string) => {
    if (phase === 'complete') return
    
    setState(prev => ({
      ...prev,
      [phase]: content
    }))
  }, [setState])

  const getPhaseContent = useCallback((phase: WorkflowPhase): string => {
    if (phase === 'complete') return ''
    return state[phase] || ''
  }, [state])

  // Generation logic
  const generateCurrentPhase = useCallback(async () => {
    if (!hasValidKey || !apiKey) {
      const error = new Error('Valid OpenRouter API key is required')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error, state.phase)
      return
    }

    if (state.phase === 'complete') return

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null 
    }))

    onGenerationStart?.(state.phase)

    try {
      // Build the appropriate prompt based on phase
      const systemPrompt = getSystemPromptForPhase(state.phase)
      const userPrompt = buildUserPrompt(state)

      // Log workflow state for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('=== WORKFLOW GENERATION DEBUG ===', {
          phase: state.phase,
          featureName: state.featureName || 'EMPTY',
          description: state.description || 'EMPTY', 
          descriptionLength: state.description?.length || 0,
          contextFiles: state.context.length,
          contextFileNames: state.context.map(f => f.name),
          contextFileTypes: state.context.map(f => f.type),
          userPrompt: userPrompt.substring(0, 300) + '...',
          fullState: { ...state }
        })
        console.log('=== FULL USER PROMPT ===', userPrompt)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          model: selectedModel?.id || 'anthropic/claude-3.5-sonnet', // Use selected model or default
          systemPrompt,
          userPrompt,
          contextFiles: state.context,
          options: {
            temperature: 0.3,
            max_tokens: 8192
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Generation failed')
      }

      const { content } = await response.json()

      setState(prev => ({
        ...prev,
        [state.phase]: content,
        isGenerating: false
      }))

      onGenerationComplete?.(state.phase, content)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message
      }))
      onError?.(err, state.phase)
    }
  }, [hasValidKey, apiKey, state, setState, onGenerationStart, onGenerationComplete, onError, selectedModel])

  // Direct generation with passed data (bypasses state issues)
  const generateWithData = useCallback(async (featureName: string, description: string, contextFiles: ContextFile[]) => {
    if (!hasValidKey || !apiKey) {
      const error = new Error('Valid OpenRouter API key is required')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error, state.phase)
      return
    }

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null 
    }))

    onGenerationStart?.(state.phase)

    try {
      // Build user prompt directly with passed data
      const directState = {
        featureName,
        description,
        context: contextFiles,
        phase: state.phase,
        requirements: state.requirements,
        design: state.design,
        tasks: state.tasks
      }

      const systemPrompt = getSystemPromptForPhase(state.phase)
      let userPrompt = buildUserPrompt(directState as SpecState)

      // Estimate token count (rough approximation: ~4 chars per token)
      const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4)
      const maxTokens = 8192 // max output tokens we're requesting
      const modelContextLimit = 32000 // leaving some buffer from 32768
      
      console.log('=== DIRECT GENERATION ===', {
        featureName,
        description: description.substring(0, 100) + '...',
        contextFiles: contextFiles.length,
        estimatedInputTokens: estimatedTokens,
        userPromptLength: userPrompt.length,
        phase: state.phase
      })
      
      // Check if we're approaching token limits
      if (estimatedTokens + maxTokens > modelContextLimit) {
        console.warn('Token limit warning:', {
          estimatedInput: estimatedTokens,
          maxOutput: maxTokens,
          total: estimatedTokens + maxTokens,
          limit: modelContextLimit
        })
        
        // For now, filter out image files if we're over limit
        const filteredContextFiles = contextFiles.filter(file => file.type !== 'image/png' && file.type !== 'image/jpeg')
        
        if (filteredContextFiles.length !== contextFiles.length) {
          console.log('Filtered out image files to reduce token count')
          // Rebuild with filtered context
          const filteredState = { ...directState, context: filteredContextFiles }
          const filteredUserPrompt = buildUserPrompt(filteredState as SpecState)
          const newEstimate = Math.ceil((systemPrompt.length + filteredUserPrompt.length) / 4)
          
          console.log('After filtering images:', {
            originalTokens: estimatedTokens,
            newTokens: newEstimate,
            reduction: estimatedTokens - newEstimate
          })
          
          // Use filtered data if still reasonable
          if (newEstimate + maxTokens <= modelContextLimit) {
            directState.context = filteredContextFiles
            userPrompt = filteredUserPrompt
          }
        }
      }

      console.log('=== SENDING TO API ===', {
        url: '/api/generate',
        modelId: selectedModel?.id || 'anthropic/claude-3.5-sonnet',
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        contextFilesCount: contextFiles.length
      })
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          model: selectedModel?.id || 'anthropic/claude-3.5-sonnet',
          systemPrompt,
          userPrompt,
          contextFiles,
          options: {
            temperature: 0.3,
            max_tokens: 8192
          }
        })
      })

      console.log('=== API RESPONSE STATUS ===', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('=== API ERROR RESPONSE ===', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: { message: errorText } }
        }
        throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log('=== RAW API RESPONSE ===', {
        responseLength: responseText.length,
        firstChars: responseText.substring(0, 200)
      })
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (error) {
        console.error('=== JSON PARSE ERROR ===', error, responseText)
        throw new Error('Invalid JSON response from API')
      }
      
      console.log('=== PARSED API RESPONSE ===', {
        hasContent: !!responseData.content,
        contentLength: responseData.content?.length || 0,
        responseKeys: Object.keys(responseData)
      })
      
      const { content } = responseData

      setState(prev => ({
        ...prev,
        [state.phase]: content,
        isGenerating: false,
        featureName, // Also update the state for persistence
        description,
        context: contextFiles
      }))

      onGenerationComplete?.(state.phase, content)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message
      }))
      onError?.(err, state.phase)
    }
  }, [hasValidKey, apiKey, state, setState, onGenerationStart, onGenerationComplete, onError, selectedModel])

  // Refinement logic
  const refineCurrentPhase = useCallback(async (feedback: string) => {
    if (!hasValidKey || !apiKey) {
      const error = new Error('Valid OpenRouter API key is required')
      onError?.(error, state.phase)
      return
    }

    if (state.phase === 'complete') return

    const currentContent = getPhaseContent(state.phase)
    if (!currentContent.trim()) {
      const error = new Error('No content to refine. Generate initial content first.')
      onError?.(error, state.phase)
      return
    }

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null 
    }))

    // Add to refinement history
    const refinementRequest: RefinementRequest = {
      phase: state.phase,
      currentContent,
      feedback,
      timestamp: Date.now()
    }

    try {
      const systemPrompt = getRefinementPromptForPhase(state.phase)
      const userPrompt = `
Current ${state.phase} content:
${currentContent}

User feedback: ${feedback}

Please update the ${state.phase} document based on this feedback while maintaining the overall structure and format.
      `.trim()

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          model: selectedModel?.id || 'anthropic/claude-3.5-sonnet',
          systemPrompt,
          userPrompt,
          options: {
            temperature: 0.3,
            max_tokens: 8192
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Refinement failed')
      }

      const { content } = await response.json()

      setState(prev => ({
        ...prev,
        [state.phase]: content,
        isGenerating: false
      }))

      // Update refinement history
      setRefinementHistory(prev => {
        const phaseHistory = prev.find(h => h.phase === state.phase)
        
        if (phaseHistory) {
          return prev.map(h => 
            h.phase === state.phase 
              ? {
                  ...h,
                  versions: [...h.versions, {
                    content,
                    timestamp: Date.now(),
                    feedback
                  }]
                }
              : h
          )
        } else {
          return [...prev, {
            phase: state.phase,
            versions: [{
              content,
              timestamp: Date.now(),
              feedback
            }]
          }]
        }
      })

      onGenerationComplete?.(state.phase, content)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message
      }))
      onError?.(err, state.phase)
    }
  }, [hasValidKey, apiKey, state, setState, getPhaseContent, onGenerationComplete, onError])

  // Approval and progression
  const approveCurrentPhase = useCallback(() => {
    if (state.phase === 'complete') return

    setState(prev => ({
      ...prev,
      approvals: {
        ...prev.approvals,
        [state.phase]: true
      }
    }))
  }, [state.phase, setState])

  const rejectCurrentPhase = useCallback(() => {
    if (state.phase === 'complete') return

    setState(prev => ({
      ...prev,
      approvals: {
        ...prev.approvals,
        [state.phase]: false
      }
    }))
  }, [state.phase, setState])

  const proceedToNextPhase = useCallback(() => {
    if (!canProceedToNext || !nextPhase) return

    const oldPhase = state.phase
    setState(prev => ({ ...prev, phase: nextPhase }))
    onPhaseChange?.(nextPhase, oldPhase)
  }, [canProceedToNext, nextPhase, state.phase, setState, onPhaseChange])

  const goToPreviousPhase = useCallback(() => {
    if (!canGoBack || !previousPhase) return

    const oldPhase = state.phase
    setState(prev => ({ ...prev, phase: previousPhase }))
    onPhaseChange?.(previousPhase, oldPhase)
  }, [canGoBack, previousPhase, state.phase, setState, onPhaseChange])

  // Utility functions
  const reset = useCallback(() => {
    setState(DEFAULT_SPEC_STATE)
    setRefinementHistory([])
  }, [setState])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [setState])

  // Additional methods for test compatibility
  const generateContent = useCallback(async (phase: WorkflowPhase, prompt: string, model: string) => {
    // For now, delegate to generateCurrentPhase - could extend to support specific phases later
    if (phase !== state.phase) {
      // Temporarily switch to target phase
      const currentPhase = state.phase
      setState(prev => ({ ...prev, phase }))
      await generateCurrentPhase()
      setState(prev => ({ ...prev, phase: currentPhase }))
    } else {
      await generateCurrentPhase()
    }
  }, [state.phase, setState, generateCurrentPhase])

  const refineContent = useCallback(async (phase: WorkflowPhase, feedback: string, model: string) => {
    // For now, delegate to refineCurrentPhase - could extend to support specific phases later
    if (phase !== state.phase) {
      const currentPhase = state.phase
      setState(prev => ({ ...prev, phase }))
      await refineCurrentPhase(feedback)
      setState(prev => ({ ...prev, phase: currentPhase }))
    } else {
      await refineCurrentPhase(feedback)
    }
  }, [state.phase, setState, refineCurrentPhase])

  const setCurrentPhase = useCallback((phase: WorkflowPhase) => {
    setState(prev => ({ ...prev, phase }))
  }, [setState])

  const updateApproval = useCallback((phase: WorkflowPhase, status: 'approved' | 'pending') => {
    setState(prev => ({
      ...prev,
      approvals: {
        ...prev.approvals,
        [phase]: status === 'approved'
      }
    }))
  }, [setState])

  const progressToNextPhase = useCallback(() => {
    proceedToNextPhase()
  }, [proceedToNextPhase])

  const resetWorkflow = useCallback(() => {
    reset()
  }, [reset])

  const setError = useCallback((message: string) => {
    setState(prev => ({ ...prev, error: message }))
  }, [setState])

  const canProgressToNextPhase = useCallback(() => {
    return canProceedToNext
  }, [canProceedToNext])

  const isWorkflowComplete = useCallback(() => {
    return state.approvals.requirements && state.approvals.design && state.approvals.tasks
  }, [state.approvals])

  // Helper getters for test compatibility
  const phaseContent = {
    requirements: state.requirements || '',
    design: state.design || '',
    tasks: state.tasks || ''
  }

  const approvals = {
    requirements: state.approvals.requirements ? 'approved' as const : 'pending' as const,
    design: state.approvals.design ? 'approved' as const : 'pending' as const,
    tasks: state.approvals.tasks ? 'approved' as const : 'pending' as const
  }

  const exportData = useCallback(() => {
    return {
      state,
      refinementHistory,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }, [state, refinementHistory])

  const importData = useCallback((data: any): boolean => {
    try {
      if (data && data.state && typeof data.state === 'object') {
        setState(data.state)
        if (data.refinementHistory && Array.isArray(data.refinementHistory)) {
          setRefinementHistory(data.refinementHistory)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }, [setState])

  // Track phase changes
  useEffect(() => {
    if (previousPhaseRef.current !== state.phase) {
      onPhaseChange?.(state.phase, previousPhaseRef.current)
      previousPhaseRef.current = state.phase
    }
  }, [state.phase, onPhaseChange])

  return {
    // State
    state,
    refinementHistory,
    
    // Phase management
    currentPhase: state.phase,
    canProceedToNext,
    canGoBack,
    nextPhase,
    previousPhase,
    
    // Basic actions
    setFeatureName,
    setDescription,
    addContextFile,
    removeContextFile,
    clearContext,
    
    // Generation actions
    generateCurrentPhase,
    generateWithData,
    refineCurrentPhase,
    
    // Approval and progression
    approveCurrentPhase,
    rejectCurrentPhase,
    proceedToNextPhase,
    goToPreviousPhase,
    
    // Content management
    updatePhaseContent,
    getPhaseContent,
    
    // Utility actions
    reset,
    clearError,
    exportData,
    importData,
    forceSync,
    
    // Test-compatible API aliases and additional methods
    generateContent,
    refineContent,
    setCurrentPhase,
    updateApproval,
    progressToNextPhase,
    resetWorkflow,
    setError,
    canProgressToNextPhase,
    isWorkflowComplete,
    
    // Test-compatible properties
    isGenerating: state.isGenerating,
    error: state.error,
    phaseContent,
    approvals
  }
}

// Helper functions for prompts
function getSystemPromptForPhase(phase: WorkflowPhase): string {
  switch (phase) {
    case 'requirements':
      return 'You are a requirements analyst generating comprehensive EARS format requirements with user stories and acceptance criteria. You will receive a feature description and any context files. Create detailed, actionable requirements following EARS patterns (When [trigger] the [system] shall [response]). Include user stories in the format "As a [role] I want [goal] so that [benefit]" with acceptance criteria.'
    case 'design':
      return 'You are a system architect creating comprehensive technical design documents with Mermaid diagrams. Based on the provided requirements, create architectural designs, component diagrams, sequence diagrams, and technical specifications. Use Mermaid syntax for all diagrams.'
    case 'tasks':
      return 'You are a technical lead creating detailed implementation task lists with numbered checkboxes. Based on the requirements and design, break down the work into specific, actionable development tasks with clear acceptance criteria and estimated effort.'
    default:
      return 'You are a helpful assistant creating technical specifications.'
  }
}

function getRefinementPromptForPhase(phase: WorkflowPhase): string {
  switch (phase) {
    case 'requirements':
      return 'You are a requirements analyst refining existing requirements based on feedback while maintaining EARS format.'
    case 'design':
      return 'You are a system architect refining existing design documents and updating Mermaid diagrams as needed.'
    case 'tasks':
      return 'You are a technical lead refining implementation tasks based on feedback while maintaining the numbered checkbox format.'
    default:
      return 'You are a helpful assistant refining content based on feedback.'
  }
}

function buildUserPrompt(state: SpecState): string {
  let prompt = `Feature: ${state.featureName}

Description:
${state.description}`

  if (state.context.length > 0) {
    prompt += '\n\nContext Files:\n'
    state.context.forEach(file => {
      if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type?.startsWith('image/')) {
        // For images, just mention them but don't include the content (base64 would be huge)
        prompt += `\n## ${file.name} (Image File):\nThis is an image file (${file.type}) with ${file.size} bytes that provides visual context for the feature.\n`
      } else if (file.type !== 'image') {
        // For text files, include the content but limit size
        const content = file.content?.toString() || ''
        const maxContentLength = 2000 // Limit to ~500 tokens per file
        const truncatedContent = content.length > maxContentLength 
          ? content.substring(0, maxContentLength) + '\n\n[Content truncated due to length]'
          : content
        prompt += `\n## ${file.name}:\n${truncatedContent}\n`
      }
    })
  }

  // Add existing content for subsequent phases
  if (state.phase === 'design' && state.requirements) {
    prompt += '\n\nExisting Requirements:\n' + state.requirements
  } else if (state.phase === 'tasks' && state.requirements && state.design) {
    prompt += '\n\nExisting Requirements:\n' + state.requirements
    prompt += '\n\nExisting Design:\n' + state.design
  }

  return prompt
}