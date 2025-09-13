import { renderHook, act } from '@testing-library/react'
import { useSpecWorkflow } from '@/hooks/useSpecWorkflow'

// Mock the OpenRouter client
jest.mock('@/lib/openrouter/client', () => ({
  OpenRouterClient: jest.fn().mockImplementation(() => ({
    generateCompletion: jest.fn(),
    listModels: jest.fn(),
    testConnection: jest.fn(),
  })),
}))

describe('useSpecWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.currentPhase).toBe('requirements')
      expect(result.current.phaseContent.requirements).toBe('')
      expect(result.current.phaseContent.design).toBe('')
      expect(result.current.phaseContent.tasks).toBe('')
      expect(result.current.approvals.requirements).toBe('pending')
      expect(result.current.approvals.design).toBe('pending')
      expect(result.current.approvals.tasks).toBe('pending')
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should load state from localStorage if available', () => {
      const savedState = {
        currentPhase: 'design',
        phaseContent: {
          requirements: 'Test requirements',
          design: 'Test design',
          tasks: ''
        },
        approvals: {
          requirements: 'approved',
          design: 'pending',
          tasks: 'pending'
        }
      }
      localStorage.setItem('openspec-workflow', JSON.stringify(savedState))

      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.currentPhase).toBe('design')
      expect(result.current.phaseContent.requirements).toBe('Test requirements')
      expect(result.current.phaseContent.design).toBe('Test design')
      expect(result.current.approvals.requirements).toBe('approved')
    })
  })

  describe('Phase Management', () => {
    it('should update current phase', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.setCurrentPhase('design')
      })

      expect(result.current.currentPhase).toBe('design')
    })

    it('should update phase content', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updatePhaseContent('requirements', 'New requirements content')
      })

      expect(result.current.phaseContent.requirements).toBe('New requirements content')
    })

    it('should update approval status', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updateApproval('requirements', 'approved')
      })

      expect(result.current.approvals.requirements).toBe('approved')
    })

    it('should progress to next phase when approved', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updateApproval('requirements', 'approved')
        result.current.progressToNextPhase()
      })

      expect(result.current.currentPhase).toBe('design')
    })

    it('should not progress if current phase is not approved', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.progressToNextPhase()
      })

      expect(result.current.currentPhase).toBe('requirements')
    })

    it('should not progress beyond tasks phase', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      // Set up to tasks phase with approval
      act(() => {
        result.current.setCurrentPhase('tasks')
        result.current.updateApproval('tasks', 'approved')
        result.current.progressToNextPhase()
      })

      expect(result.current.currentPhase).toBe('tasks')
    })
  })

  describe('Content Generation', () => {
    it('should set loading state during generation', async () => {
      const { result } = renderHook(() => useSpecWorkflow())

      const generatePromise = act(async () => {
        await result.current.generateContent('requirements', 'test prompt', 'test-model')
      })

      expect(result.current.isGenerating).toBe(true)
      await generatePromise
    })

    it('should handle generation errors', async () => {
      const mockClient = require('@/lib/openrouter/client').OpenRouterClient
      mockClient.mockImplementation(() => ({
        generateCompletion: jest.fn().mockRejectedValue(new Error('API Error')),
      }))

      const { result } = renderHook(() => useSpecWorkflow())

      await act(async () => {
        await result.current.generateContent('requirements', 'test prompt', 'test-model')
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.isGenerating).toBe(false)
    })

    it('should clear errors when generation succeeds', async () => {
      const mockClient = require('@/lib/openrouter/client').OpenRouterClient
      mockClient.mockImplementation(() => ({
        generateCompletion: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Generated content' } }]
        }),
      }))

      const { result } = renderHook(() => useSpecWorkflow())

      // Set initial error
      act(() => {
        result.current.setError('Previous error')
      })

      await act(async () => {
        await result.current.generateContent('requirements', 'test prompt', 'test-model')
      })

      expect(result.current.error).toBeNull()
      expect(result.current.phaseContent.requirements).toBe('Generated content')
    })
  })

  describe('Content Refinement', () => {
    it('should refine existing content', async () => {
      const mockClient = require('@/lib/openrouter/client').OpenRouterClient
      mockClient.mockImplementation(() => ({
        generateCompletion: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Refined content' } }]
        }),
      }))

      const { result } = renderHook(() => useSpecWorkflow())

      // Set initial content
      act(() => {
        result.current.updatePhaseContent('requirements', 'Original content')
      })

      await act(async () => {
        await result.current.refineContent('requirements', 'Make it better', 'test-model')
      })

      expect(result.current.phaseContent.requirements).toBe('Refined content')
    })

    it('should handle refinement errors', async () => {
      const mockClient = require('@/lib/openrouter/client').OpenRouterClient
      mockClient.mockImplementation(() => ({
        generateCompletion: jest.fn().mockRejectedValue(new Error('Refinement failed')),
      }))

      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updatePhaseContent('requirements', 'Original content')
      })

      await act(async () => {
        await result.current.refineContent('requirements', 'Make it better', 'test-model')
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.phaseContent.requirements).toBe('Original content') // Should preserve original
    })
  })

  describe('State Persistence', () => {
    it('should save state to localStorage on changes', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updatePhaseContent('requirements', 'Test content')
      })

      const savedState = JSON.parse(localStorage.getItem('openspec-workflow') || '{}')
      expect(savedState.phaseContent.requirements).toBe('Test content')
    })

    it('should reset workflow state', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      // Set some state
      act(() => {
        result.current.setCurrentPhase('design')
        result.current.updatePhaseContent('requirements', 'Test content')
        result.current.updateApproval('requirements', 'approved')
      })

      // Reset
      act(() => {
        result.current.resetWorkflow()
      })

      expect(result.current.currentPhase).toBe('requirements')
      expect(result.current.phaseContent.requirements).toBe('')
      expect(result.current.approvals.requirements).toBe('pending')
      expect(localStorage.getItem('openspec-workflow')).toBeNull()
    })
  })

  describe('Validation', () => {
    it('should validate phase transitions', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.canProgressToNextPhase()).toBe(false)

      act(() => {
        result.current.updateApproval('requirements', 'approved')
      })

      expect(result.current.canProgressToNextPhase()).toBe(true)
    })

    it('should validate workflow completion', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.isWorkflowComplete()).toBe(false)

      act(() => {
        result.current.updateApproval('requirements', 'approved')
        result.current.updateApproval('design', 'approved')
        result.current.updateApproval('tasks', 'approved')
      })

      expect(result.current.isWorkflowComplete()).toBe(true)
    })
  })
})