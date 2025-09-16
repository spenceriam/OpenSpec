/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useSpecWorkflow } from '@/hooks/useSpecWorkflow'
import { usePromptStorage, useContextFilesStorage, useModelStorage } from '@/hooks/useSessionStorage'

// Mock the storage hooks
const mockLocalStorage = {
  clear: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

const mockSessionStorage = {
  clear: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

// Mock window.localStorage and window.sessionStorage
Object.defineProperty(window, 'localStorage', { 
  value: mockLocalStorage,
  writable: true
})

Object.defineProperty(window, 'sessionStorage', { 
  value: mockSessionStorage,
  writable: true
})

// Mock the API key storage hook
const mockUseSimpleApiKeyStorage = {
  value: 'test-api-key',
  hasValidKey: true,
  setAPIKey: jest.fn(),
  clearAPIKey: jest.fn()
}

jest.mock('@/hooks/useSimpleApiKeyStorage', () => ({
  useSimpleApiKeyStorage: () => mockUseSimpleApiKeyStorage
}))

describe('Selective Clearing Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockLocalStorage.clear.mockClear()
    mockSessionStorage.clear.mockClear()
    mockLocalStorage.removeItem.mockClear()
    mockSessionStorage.removeItem.mockClear()
  })

  describe('resetProjectOnly method', () => {
    it('should reset workflow state while preserving API key and model', () => {
      const { result } = renderHook(() => useSpecWorkflow({}))

      // Set up initial state with content
      act(() => {
        result.current.updatePhaseContent('requirements', 'Test requirements')
        result.current.updatePhaseContent('design', 'Test design')
        result.current.setCurrentPhase('design')
      })

      // Verify content exists
      expect(result.current.phaseContent.requirements).toBe('Test requirements')
      expect(result.current.phaseContent.design).toBe('Test design')
      expect(result.current.currentPhase).toBe('design')

      // Perform selective reset
      act(() => {
        result.current.resetProjectOnly()
      })

      // Verify workflow state is reset
      expect(result.current.phaseContent.requirements).toBe('')
      expect(result.current.phaseContent.design).toBe('')
      expect(result.current.phaseContent.tasks).toBe('')
      expect(result.current.currentPhase).toBe('requirements')

      // Verify only project-specific localStorage items are removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('openspec-workflow-state')
      // Should NOT clear session storage items (API key, model)
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled()
    })

    it('should not affect API key storage when called', () => {
      const { result } = renderHook(() => useSpecWorkflow({}))

      act(() => {
        result.current.resetProjectOnly()
      })

      // Verify API key storage methods are not called during project reset
      expect(mockUseSimpleApiKeyStorage.clearAPIKey).not.toHaveBeenCalled()
    })
  })

  describe('Session storage hooks selective clearing', () => {
    it('should clear prompt but not API key when using clearPromptForNewProject', () => {
      const { result } = renderHook(() => usePromptStorage())

      act(() => {
        result.current.setPrompt('Test prompt')
      })

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('openspec-prompt', 'Test prompt')

      act(() => {
        result.current.clearPromptForNewProject()
      })

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openspec-prompt')
      // Should not affect API key storage
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-api-key')
    })

    it('should clear context files but not model when using clearFilesForNewProject', () => {
      const { result } = renderHook(() => useContextFilesStorage())

      const testFiles = [{ id: '1', name: 'test.txt', content: 'test content' }]

      act(() => {
        result.current.setFiles(testFiles)
      })

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('openspec-context-files', JSON.stringify(testFiles))

      act(() => {
        result.current.clearFilesForNewProject()
      })

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openspec-context-files')
      // Should not affect model storage
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-selected-model')
    })

    it('should preserve model storage when clearing project data', () => {
      const { result } = renderHook(() => useModelStorage())

      const testModel = { id: 'test-model', name: 'Test Model' }

      act(() => {
        result.current.setModel(testModel)
      })

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('openspec-selected-model', JSON.stringify(testModel))

      // Clear project data (should not affect model)
      const { result: promptResult } = renderHook(() => usePromptStorage())
      const { result: filesResult } = renderHook(() => useContextFilesStorage())

      act(() => {
        promptResult.current.clearPromptForNewProject()
        filesResult.current.clearFilesForNewProject()
      })

      // Verify model storage is not touched
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-selected-model')
    })
  })

  describe('Integration: Complete selective clearing workflow', () => {
    it('should preserve authentication while clearing project data', () => {
      // Set up initial state
      const workflowHook = renderHook(() => useSpecWorkflow({}))
      const promptHook = renderHook(() => usePromptStorage())
      const filesHook = renderHook(() => useContextFilesStorage())

      // Add content to workflow
      act(() => {
        workflowHook.result.current.updatePhaseContent('requirements', 'Test requirements')
        workflowHook.result.current.setCurrentPhase('design')
        promptHook.result.current.setPrompt('Test prompt')
        filesHook.result.current.setFiles([{ id: '1', name: 'test.txt', content: 'test' }])
      })

      // Verify initial state
      expect(workflowHook.result.current.phaseContent.requirements).toBe('Test requirements')
      expect(workflowHook.result.current.currentPhase).toBe('design')

      // Perform selective clearing (simulating new project start)
      act(() => {
        workflowHook.result.current.resetProjectOnly()
        promptHook.result.current.clearPromptForNewProject()
        filesHook.result.current.clearFilesForNewProject()
      })

      // Verify project data is cleared
      expect(workflowHook.result.current.phaseContent.requirements).toBe('')
      expect(workflowHook.result.current.currentPhase).toBe('requirements')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openspec-prompt')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openspec-context-files')

      // Verify API key and authentication data is preserved
      expect(mockUseSimpleApiKeyStorage.clearAPIKey).not.toHaveBeenCalled()
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-api-key')
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-api-key-tested')
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('openspec-selected-model')

      // Verify localStorage is selectively cleared (only workflow state)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('openspec-workflow-state')
      expect(mockLocalStorage.clear).not.toHaveBeenCalled() // Should not do full clear
    })
  })

  describe('Error handling', () => {
    it('should handle storage errors gracefully in resetProjectOnly', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useSpecWorkflow({}))

      // Should not throw despite storage error
      act(() => {
        expect(() => result.current.resetProjectOnly()).not.toThrow()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle missing sessionStorage gracefully', () => {
      // Temporarily remove sessionStorage
      const originalSessionStorage = window.sessionStorage
      // @ts-ignore
      delete window.sessionStorage

      const { result } = renderHook(() => usePromptStorage())

      // Should not throw when sessionStorage is unavailable
      act(() => {
        expect(() => result.current.clearPromptForNewProject()).not.toThrow()
      })

      // Restore sessionStorage
      window.sessionStorage = originalSessionStorage
    })
  })
})