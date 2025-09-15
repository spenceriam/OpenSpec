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
    error: storageError
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
    setState(prev => ({ ...prev, featureName: name.trim() }))
  }, [setState])

  const setDescription = useCallback((description: string) => {
    setState(prev => ({ ...prev, description }))
  }, [setState])

  // Context file management
  const addContextFile = useCallback((file: ContextFile) => {
    setState(prev => ({
      ...prev,
      context: [...prev.context.filter(f => f.id !== file.id), file]
    }))
  }, [setState])

  const removeContextFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      context: prev.context.filter(f => f.id !== fileId)
    }))
  }, [setState])

  const clearContext = useCallback(() => {
    setState(prev => ({ ...prev, context: [] }))
  }, [setState])

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

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          model: 'anthropic/claude-3.5-sonnet', // Default model
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
  }, [hasValidKey, apiKey, state, setState, onGenerationStart, onGenerationComplete, onError])

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
          model: 'anthropic/claude-3.5-sonnet',
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
      return 'You are a requirements analyst generating EARS format requirements with user stories and acceptance criteria.'
    case 'design':
      return 'You are a system architect creating comprehensive design documents with Mermaid diagrams.'
    case 'tasks':
      return 'You are a technical lead creating implementation task lists with numbered checkboxes.'
    default:
      return 'You are a helpful assistant.'
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
  let prompt = `Feature: ${state.featureName}\n\nDescription:\n${state.description}`

  if (state.context.length > 0) {
    prompt += '\n\nContext Files:\n'
    state.context.forEach(file => {
      if (file.type !== 'image') {
        prompt += `\n## ${file.name}:\n${file.content}\n`
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