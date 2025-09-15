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
          // contextFiles are already embedded in userPrompt by buildUserPrompt()
          contextFiles: [],
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

  // Phase-specific generation matching Kiro IDE's workflow
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
      const systemPrompt = getSystemPromptForPhase(state.phase)
      let userPrompt: string
      
      // Build phase-specific prompts (clean separation like Kiro IDE)
      switch (state.phase) {
        case 'requirements':
          // Requirements phase: Only use original input + context files with size limits
          const maxDescriptionLength = 5000 // ~1250 tokens max for description
          const truncatedDescription = description.length > maxDescriptionLength
            ? description.substring(0, maxDescriptionLength) + '\n\n[Description truncated to fit token limits]'
            : description
          
          console.log(`Requirements generation:`, {
            originalDescriptionLength: description.length,
            truncatedDescriptionLength: truncatedDescription.length,
            contextFilesCount: contextFiles.length,
            phase: state.phase
          })
          
          // Filter and truncate context BEFORE calling buildRequirementsPrompt
          const maxFileSize = 2000 // Max 2KB per file (~500 tokens)
          const maxTotalSize = 5000 // Max 5KB total (~1250 tokens)
          
          let totalSize = 0
          const contextToSend = contextFiles
            .filter(file => {
              // Skip images completely using robust detection
              if (isImageLike(file)) {
                console.warn(`Skipping image file: ${file.name} (type: ${file.type})`)
                return false
              }
              
              const fileSize = file.content?.length || 0
              
              // Skip files that are too large individually
              if (fileSize > maxFileSize) {
                console.warn(`Skipping large file ${file.name}: ${fileSize} chars (max ${maxFileSize})`) 
                return false
              }
              
              // Skip files that would exceed total size limit
              if (totalSize + fileSize > maxTotalSize) {
                console.warn(`Skipping file ${file.name}: would exceed total limit (${totalSize + fileSize}/${maxTotalSize})`)
                return false
              }
              
              totalSize += fileSize
              return true
            })
            .map(file => {
              // Truncate content to be extra safe
              const truncatedContent = file.content && file.content.length > maxFileSize
                ? file.content.substring(0, maxFileSize) + '\n\n[File truncated due to size limits]'
                : file.content
                
              return {
                ...file,
                content: truncatedContent
              }
            })
          
          userPrompt = buildRequirementsPrompt(featureName, truncatedDescription, contextToSend)
          break
          
        case 'design':
          // Design phase: Only use approved requirements (no original description/files)
          if (!state.requirements) {
            throw new Error('Requirements must be completed and approved before generating design')
          }
          userPrompt = buildDesignPrompt(state.requirements)
          break
          
        case 'tasks':
          // Tasks phase: Only use approved requirements + design
          if (!state.requirements || !state.design) {
            throw new Error('Requirements and Design must be completed and approved before generating tasks')
          }
          userPrompt = buildTasksPrompt(state.requirements, state.design)
          break
          
        default:
          throw new Error(`Unknown phase: ${state.phase}`)
      }

      // Validate token limits with new standardized method
      const tokenValidation = validateTokenLimits(systemPrompt, userPrompt, 8192, 200000)
      
      console.log('=== PHASE-SPECIFIC GENERATION ===', {
        phase: state.phase,
        featureName: state.phase === 'requirements' ? featureName : '[Using approved content]',
        tokenBreakdown: tokenValidation.breakdown,
        isValid: tokenValidation.valid,
        promptStrategy: {
          requirements: 'Original description + context files',
          design: 'Approved requirements only', 
          tasks: 'Approved requirements + design only'
        }[state.phase]
      })
      
      // Token validation - fail fast if limits exceeded
      if (!tokenValidation.valid) {
        console.error('=== TOKEN LIMIT EXCEEDED ===', {
          phase: state.phase,
          error: tokenValidation.error,
          breakdown: tokenValidation.breakdown
        })
        throw new Error(tokenValidation.error || `Phase ${state.phase} content exceeds token limit.`)
      }

      // Get context files to send based on phase (already filtered during prompt building)
      let contextToSend: ContextFile[] = []
      if (state.phase === 'requirements') {
        // Use the already filtered contextToSend from the requirements generation above
        // No additional filtering needed here since it was done in the switch statement
        contextToSend = [] // Empty since context is embedded in userPrompt already
        
        console.log(`Context files for Requirements phase: embedded in userPrompt to prevent duplication`)
      }
      // Design and Tasks phases don't need context files - they use approved content
      
      console.log('=== SENDING TO API - DETAILED ANALYSIS ===', {
        url: '/api/generate',
        phase: state.phase,
        modelId: selectedModel?.id || 'anthropic/claude-3.5-sonnet',
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        contextFilesCount: contextToSend.length,
        tokenEstimation: {
          systemPrompt: estimateTokens(systemPrompt),
          userPrompt: estimateTokens(userPrompt),
          totalInput: estimateTokens(systemPrompt + userPrompt),
          maxOutput: 8192,
          totalRequest: estimateTokens(systemPrompt + userPrompt) + 8192
        },
        inputStrategy: {
          requirements: 'Original input + filtered context files',
          design: 'Approved requirements only (no context files)',
          tasks: 'Approved requirements + design (no context files)'
        }[state.phase]
      })
      
      // Log the actual content being sent to debug token bloat
      console.log('=== SYSTEM PROMPT PREVIEW ===', {
        fullLength: systemPrompt.length,
        estimatedTokens: estimateTokens(systemPrompt),
        preview: systemPrompt.substring(0, 200) + '...'
      })
      
      console.log('=== USER PROMPT PREVIEW ===', {
        fullLength: userPrompt.length,
        estimatedTokens: estimateTokens(userPrompt),
        preview: userPrompt.substring(0, 500) + '...',
        actualContent: {
          hasFeatureName: userPrompt.includes('Feature:'),
          hasDescription: userPrompt.includes('Description:'),
          hasContextFiles: userPrompt.includes('Context Files:'),
          hasRequirements: userPrompt.includes('Requirements:'),
          hasDesign: userPrompt.includes('Design:')
        }
      })
      
      if (contextToSend.length > 0) {
        console.log('=== CONTEXT FILES BEING SENT ===', contextToSend.map(f => ({
          name: f.name,
          type: f.type,
          contentLength: f.content?.length || 0
        })))
      }
      
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
          // contextFiles are already embedded in userPrompt, don't send separately
          contextFiles: [],
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

      // Update state appropriately for each phase
      setState(prev => {
        const baseUpdate = {
          ...prev,
          [state.phase]: content,
          isGenerating: false
        }
        
        // Only update feature metadata during requirements phase
        if (state.phase === 'requirements') {
          return {
            ...baseUpdate,
            featureName,
            description,
            context: contextFiles
          }
        }
        
        // Design and Tasks phases don't need to update original input data
        return baseUpdate
      })

      onGenerationComplete?.(state.phase, content)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      console.error('=== GENERATION FAILED ===', {
        phase: state.phase,
        error: err.message,
        stack: err.stack
      })
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message,
        // Don't set any content on API failure
        [state.phase]: ''
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
          // contextFiles not needed for refinement
          contextFiles: [],
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
    // Use direct generation approach instead of state-dependent method
    // Extract feature name from prompt or use default
    const promptLines = prompt.trim().split('\n')
    const featureName = promptLines[0]?.replace(/^#+\s*/, '').trim() || 'Technical Specification'
    
    // Use current context files from state
    const contextFiles = state.context || []
    
    // Temporarily switch to target phase if needed
    const currentPhase = state.phase
    if (phase !== currentPhase) {
      setState(prev => ({ ...prev, phase }))
    }
    
    try {
      await generateWithData(featureName, prompt, contextFiles)
    } finally {
      // Restore original phase if it was changed
      if (phase !== currentPhase) {
        setState(prev => ({ ...prev, phase: currentPhase }))
      }
    }
  }, [state.phase, state.context, setState, generateWithData])

  const refineContent = useCallback(async (phase: WorkflowPhase, feedback: string, model: string) => {
    // Use refinement method which is separate from generation
    // Temporarily switch to target phase if needed
    const currentPhase = state.phase
    if (phase !== currentPhase) {
      setState(prev => ({ ...prev, phase }))
    }
    
    try {
      await refineCurrentPhase(feedback)
    } finally {
      // Restore original phase if it was changed
      if (phase !== currentPhase) {
        setState(prev => ({ ...prev, phase: currentPhase }))
      }
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
      return 'You are creating a requirements document in EARS format based on the provided feature description. Generate an initial requirements document following the structure with clear user stories and EARS acceptance criteria using WHEN, IF, WHILE, WHERE keywords.'
    case 'design':
      return 'You are creating a comprehensive design document based on approved requirements. Include technical architecture, components, data models, error handling, and testing strategy. Use Mermaid diagrams for complex relationships.'
    case 'tasks':
      return 'You are creating an actionable implementation plan based on approved design. Convert the design into discrete, manageable coding tasks with numbered checkboxes, specific deliverables, and requirement references.'
    default:
      return 'You are creating technical specifications following standard formats.'
  }
}

function getRefinementPromptForPhase(phase: WorkflowPhase): string {
  switch (phase) {
    case 'requirements':
      return 'You are refining existing requirements based on feedback while maintaining EARS format and structure.'
    case 'design':
      return 'You are refining existing design documents based on feedback while maintaining technical completeness and valid Mermaid diagrams.'
    case 'tasks':
      return 'You are refining implementation tasks based on feedback while maintaining the numbered checkbox format and requirement traceability.'
    default:
      return 'You are refining technical content based on feedback.'
  }
}

// Phase-specific prompt builders matching Kiro IDE's approach
function buildRequirementsPrompt(featureName: string, description: string, contextFiles: ContextFile[]): string {
  let prompt = `Feature: ${featureName}

Description:
${description}`

  // Only add context files if they exist and are small enough
  if (contextFiles.length > 0) {
    prompt += '\n\nContext Files:\n'
    
    // Calculate current prompt size to ensure we don't exceed limits
    const currentSize = prompt.length
    const maxTotalPromptSize = 12000 // ~3200 tokens total for entire prompt (more realistic)
    let remainingSpace = maxTotalPromptSize - currentSize
    
    contextFiles.forEach(file => {
      // Skip if no space remaining
      if (remainingSpace <= 100) {
        console.warn(`Skipping context file ${file.name}: not enough remaining space`)
        return
      }
      
      if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type?.startsWith('image/')) {
        // For images, just mention them but don't include the content
        const imageRef = `\n## ${file.name} (Image File):\nImage file (${file.type}) providing visual context.\n`
        if (imageRef.length <= remainingSpace) {
          prompt += imageRef
          remainingSpace -= imageRef.length
        }
      } else if (file.type !== 'image') {
        // For text files, include content with strict limits
        const content = file.content?.toString() || ''
        const maxContentForThisFile = Math.min(1000, remainingSpace - 100) // Leave buffer
        
        if (maxContentForThisFile > 0) {
          const truncatedContent = content.length > maxContentForThisFile 
            ? content.substring(0, maxContentForThisFile) + '\n[Truncated]'
            : content
          const fileSection = `\n## ${file.name}:\n${truncatedContent}\n`
          
          if (fileSection.length <= remainingSpace) {
            prompt += fileSection
            remainingSpace -= fileSection.length
          } else {
            console.warn(`Skipping context file ${file.name}: would exceed size limit`)
          }
        }
      }
    })
    
    console.log(`Final Requirements prompt size: ${prompt.length} chars (~${estimateTokens(prompt)} tokens)`)
  }

  return prompt
}

function buildDesignPrompt(requirements: string): string {
  return `Based on the following approved requirements, create a comprehensive technical design document with architectural diagrams.

## Requirements:
${requirements}`
}

function buildTasksPrompt(requirements: string, design: string): string {
  return `Based on the following approved requirements and design, create a detailed implementation task list with numbered checkboxes.

## Requirements:
${requirements}

## Design:
${design}`
}

// Standardized token estimation utility
function estimateTokens(text: string): number {
  // Based on OpenAI/Anthropic tokenization: ~3.7 chars per token for English
  return Math.ceil(text.length / 3.7)
}

function isImageLike(file: ContextFile): boolean {
  if (!file) return false
  
  // Check file type
  if (file.type && (file.type.startsWith('image/') || file.type === 'image/png' || file.type === 'image/jpeg')) {
    return true
  }
  
  // Check file name extensions
  if (file.name && /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(file.name)) {
    return true
  }
  
  // Check for data URLs (base64 images)
  if (file.content && typeof file.content === 'string' && file.content.startsWith('data:image/')) {
    return true
  }
  
  return false
}

function validateTokenLimits(systemPrompt: string, userPrompt: string, maxTokens = 8192, modelLimit = 200000): { 
  valid: boolean; 
  estimated: number; 
  breakdown: { system: number; user: number; output: number; total: number };
  error?: string;
} {
  const systemTokens = estimateTokens(systemPrompt)
  const userTokens = estimateTokens(userPrompt)
  const outputTokens = maxTokens
  const totalTokens = systemTokens + userTokens + outputTokens
  
  const breakdown = {
    system: systemTokens,
    user: userTokens,
    output: outputTokens,
    total: totalTokens
  }
  
  if (totalTokens > modelLimit) {
    return {
      valid: false,
      estimated: totalTokens,
      breakdown,
      error: `Total tokens (${totalTokens}) exceeds model limit (${modelLimit}). System: ${systemTokens}, User: ${userTokens}, Output: ${outputTokens}`
    }
  }
  
  return {
    valid: true,
    estimated: totalTokens,
    breakdown
  }
}

// Legacy function for backward compatibility - now routes to phase-specific builders
function buildUserPrompt(state: SpecState): string {
  switch (state.phase) {
    case 'requirements':
      return buildRequirementsPrompt(state.featureName, state.description, state.context)
    case 'design':
      return buildDesignPrompt(state.requirements || '')
    case 'tasks':
      return buildTasksPrompt(state.requirements || '', state.design || '')
    default:
      return buildRequirementsPrompt(state.featureName, state.description, state.context)
  }
}
