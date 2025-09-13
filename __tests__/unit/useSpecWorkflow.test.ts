import { renderHook, act } from '@testing-library/react'
import { useSpecWorkflow } from '@/hooks/useSpecWorkflow'

// Mock dependencies
jest.mock('@/hooks/useLocalStorage')
jest.mock('@/hooks/useSessionStorage')

// Mock fetch for API calls
global.fetch = jest.fn()

describe('useSpecWorkflow', () => {
  const mockUseLocalStorage = require('@/hooks/useLocalStorage').useLocalStorage as jest.Mock
  const mockUseAPIKeyStorage = require('@/hooks/useSessionStorage').useAPIKeyStorage as jest.Mock
  
  let mockSetState: jest.Mock
  let currentState: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    currentState = {
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
    
    mockSetState = jest.fn((updater) => {
      currentState = typeof updater === 'function' ? updater(currentState) : updater
    })
    
    mockUseLocalStorage.mockReturnValue({
      value: currentState,
      setValue: mockSetState,
      error: null
    })
    
    mockUseAPIKeyStorage.mockReturnValue({
      value: 'test-api-key',
      hasValidKey: true
    })
    
    // Mock successful API responses by default
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: 'Generated content' })
    })
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
        phase: 'design',
        featureName: 'Test Feature',
        description: 'Test Description',
        requirements: 'Test requirements',
        design: 'Test design',
        tasks: '',
        context: [],
        isGenerating: false,
        error: null,
        approvals: {
          requirements: true,
          design: false,
          tasks: false
        }
      }
      
      mockUseLocalStorage.mockReturnValueOnce({
        value: savedState,
        setValue: mockSetState,
        error: null
      })

      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.currentPhase).toBe('design')
      expect(result.current.phaseContent.requirements).toBe('Test requirements')
      expect(result.current.phaseContent.design).toBe('Test design')
      expect(result.current.approvals.requirements).toBe('approved')
      expect(result.current.approvals.design).toBe('pending')
    })
  })

  describe('Phase Management', () => {
    it('should call setState when updating current phase', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.setCurrentPhase('design')
      })

      expect(mockSetState).toHaveBeenCalled()
      // Verify the state update function was called with correct phase
      const updateFn = mockSetState.mock.calls[0][0]
      const newState = updateFn(currentState)
      expect(newState.phase).toBe('design')
    })

    it('should call setState when updating phase content', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updatePhaseContent('requirements', 'New requirements content')
      })

      expect(mockSetState).toHaveBeenCalled()
      const updateFn = mockSetState.mock.calls[0][0]
      const newState = updateFn(currentState)
      expect(newState.requirements).toBe('New requirements content')
    })

    it('should call setState when updating approval status', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      act(() => {
        result.current.updateApproval('requirements', 'approved')
      })

      expect(mockSetState).toHaveBeenCalled()
      const updateFn = mockSetState.mock.calls[0][0]
      const newState = updateFn(currentState)
      expect(newState.approvals.requirements).toBe(true)
    })

    it('should handle phase progression logic', () => {
      const { result } = renderHook(() => useSpecWorkflow())
      
      // Test that the hook provides progression methods
      expect(typeof result.current.progressToNextPhase).toBe('function')
      expect(typeof result.current.canProgressToNextPhase).toBe('function')
      
      // Test progression attempt
      act(() => {
        result.current.progressToNextPhase()
      })
      
      // Should not progress without approval (no setState call expected for this case)
      expect(result.current.canProgressToNextPhase()).toBe(false)
    })

  })

  describe('Hook API', () => {
    it('should provide all required methods and properties', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      // Test that all expected methods exist
      const requiredMethods = [
        'setCurrentPhase',
        'updatePhaseContent',
        'updateApproval',
        'progressToNextPhase',
        'resetWorkflow',
        'setError',
        'canProgressToNextPhase',
        'isWorkflowComplete',
        'generateContent',
        'refineContent'
      ]

      requiredMethods.forEach(method => {
        expect(typeof result.current[method]).toBe('function')
      })

      // Test that all expected properties exist
      expect(typeof result.current.currentPhase).toBe('string')
      expect(typeof result.current.isGenerating).toBe('boolean')
      expect(result.current.error).toBeNull()
      expect(typeof result.current.phaseContent).toBe('object')
      expect(typeof result.current.approvals).toBe('object')
    })

    it('should call setState when methods are invoked', () => {
      const { result } = renderHook(() => useSpecWorkflow())

      // Test setCurrentPhase
      act(() => {
        result.current.setCurrentPhase('design')
      })
      expect(mockSetState).toHaveBeenCalledTimes(1)

      // Test updatePhaseContent  
      act(() => {
        result.current.updatePhaseContent('requirements', 'test content')
      })
      expect(mockSetState).toHaveBeenCalledTimes(2)

      // Test updateApproval
      act(() => {
        result.current.updateApproval('requirements', 'approved')
      })
      expect(mockSetState).toHaveBeenCalledTimes(3)
    })

    it('should handle generation without API key', async () => {
      // Mock no API key
      mockUseAPIKeyStorage.mockReturnValueOnce({
        value: null,
        hasValidKey: false
      })

      const { result } = renderHook(() => useSpecWorkflow())

      await act(async () => {
        await result.current.generateContent('requirements', 'test prompt', 'test-model')
      })

      // Should set an error about missing API key
      expect(mockSetState).toHaveBeenCalled()
      const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0]
      const newState = lastCall(currentState)
      expect(newState.error).toContain('API key')
    })

    it('should validate workflow completion', () => {
      // Set up state with all approvals
      const approvedState = {
        ...currentState,
        approvals: {
          requirements: true,
          design: true,
          tasks: true
        }
      }
      
      mockUseLocalStorage.mockReturnValueOnce({
        value: approvedState,
        setValue: mockSetState,
        error: null
      })

      const { result } = renderHook(() => useSpecWorkflow())

      expect(result.current.isWorkflowComplete()).toBe(true)
    })
  })
})