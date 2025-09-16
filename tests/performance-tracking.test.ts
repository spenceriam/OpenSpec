import { renderHook, act } from '@testing-library/react'
import { useSpecWorkflow } from '@/hooks/useSpecWorkflow'

// Mock fetch globally
global.fetch = jest.fn()

describe('Performance Tracking in useSpecWorkflow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset fetch mock
    ;(fetch as jest.Mock).mockReset()
  })

  it('should track timing data correctly during generation', async () => {
    const mockApiResponse = {
      content: 'Generated requirements content',
      usage: {
        prompt_tokens: 500,
        completion_tokens: 300,
        total_tokens: 800
      },
      model: 'test-model'
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
      text: () => Promise.resolve(JSON.stringify(mockApiResponse))
    })

    const { result } = renderHook(() => useSpecWorkflow({
      selectedModel: { id: 'test-model', name: 'Test Model' }
    }))

    // Mock API key validation
    result.current.state.isGenerating = false

    const startTime = Date.now()

    await act(async () => {
      await result.current.generateWithData('Test Feature', 'Test description', [])
    })

    // Check that timing data was captured
    const timing = result.current.state.timing.requirements
    expect(timing.startTime).toBeGreaterThan(0)
    expect(timing.endTime).toBeGreaterThan(timing.startTime)
    expect(timing.elapsed).toBe(timing.endTime - timing.startTime)
    expect(timing.elapsed).toBeGreaterThan(0)
  })

  it('should track API response data correctly', async () => {
    const mockApiResponse = {
      content: 'Generated content',
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 600,
        total_tokens: 1600
      },
      model: 'test-model'
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
      text: () => Promise.resolve(JSON.stringify(mockApiResponse))
    })

    const { result } = renderHook(() => useSpecWorkflow({
      selectedModel: { 
        id: 'test-model', 
        name: 'Test Model',
        pricing: { prompt: '0.003', completion: '0.015' }
      }
    }))

    await act(async () => {
      await result.current.generateWithData('Test Feature', 'Test description', [])
    })

    // Check that API response data was captured
    const apiResponse = result.current.state.apiResponses.requirements
    expect(apiResponse).toBeDefined()
    expect(apiResponse?.model).toBe('test-model')
    expect(apiResponse?.tokens.prompt).toBe(1000)
    expect(apiResponse?.tokens.completion).toBe(600)
    expect(apiResponse?.tokens.total).toBe(1600)
    expect(apiResponse?.cost).toBeDefined()
    expect(apiResponse?.cost?.total).toBeGreaterThan(0)
  })

  it('should preserve timing data through localStorage migration', () => {
    // Simulate existing localStorage data with timing info
    const existingData = {
      phase: 'design',
      requirements: 'Existing requirements',
      design: '',
      tasks: '',
      timing: {
        requirements: { startTime: 1000, endTime: 5000, elapsed: 4000 },
        design: { startTime: 0, endTime: 0, elapsed: 0 },
        tasks: { startTime: 0, endTime: 0, elapsed: 0 }
      },
      apiResponses: {
        requirements: {
          model: 'test-model',
          tokens: { prompt: 500, completion: 300, total: 800 },
          cost: { prompt: 0.0015, completion: 0.0045, total: 0.006 },
          duration: 4000,
          timestamp: 5000
        },
        design: null,
        tasks: null
      }
    }

    localStorage.setItem('openspec-workflow-state', JSON.stringify(existingData))

    const { result } = renderHook(() => useSpecWorkflow())

    // Check that timing data was loaded correctly
    expect(result.current.state.timing.requirements.elapsed).toBe(4000)
    expect(result.current.state.apiResponses.requirements?.tokens.total).toBe(800)
  })

  it('should handle missing timing structure during migration', () => {
    // Simulate old localStorage data without timing/apiResponses
    const oldData = {
      phase: 'requirements',
      requirements: 'Some requirements',
      design: '',
      tasks: ''
      // Missing timing and apiResponses
    }

    localStorage.setItem('openspec-workflow-state', JSON.stringify(oldData))

    const { result } = renderHook(() => useSpecWorkflow())

    // Check that timing structure was created
    expect(result.current.state.timing).toBeDefined()
    expect(result.current.state.timing.requirements).toEqual({
      startTime: 0, endTime: 0, elapsed: 0
    })
    expect(result.current.state.apiResponses).toBeDefined()
    expect(result.current.state.apiResponses.requirements).toBeNull()
  })

  it('should track timing data even on API errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useSpecWorkflow())

    const startTime = Date.now()

    await act(async () => {
      try {
        await result.current.generateWithData('Test Feature', 'Test description', [])
      } catch (error) {
        // Expected to fail
      }
    })

    // Check that timing data was still captured even on error
    const timing = result.current.state.timing.requirements
    expect(timing.startTime).toBeGreaterThan(0)
    expect(timing.endTime).toBeGreaterThan(timing.startTime)
    expect(timing.elapsed).toBe(timing.endTime - timing.startTime)
  })
})