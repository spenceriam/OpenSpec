import { 
  saveWorkflowState, 
  loadWorkflowState, 
  clearWorkflowState,
  saveApiKey,
  loadApiKey,
  clearApiKey,
  saveUploadedFiles,
  loadUploadedFiles,
  clearUploadedFiles
} from '@/lib/storage'

describe('Storage Management', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Workflow State Management', () => {
    const mockWorkflowState = {
      currentPhase: 'design' as const,
      phaseContent: {
        requirements: 'Test requirements content',
        design: 'Test design content',
        tasks: ''
      },
      approvals: {
        requirements: 'approved' as const,
        design: 'pending' as const,
        tasks: 'pending' as const
      },
      isGenerating: false,
      lastUpdated: '2024-01-15T10:00:00.000Z'
    }

    it('should save workflow state to localStorage', () => {
      saveWorkflowState(mockWorkflowState)

      const saved = localStorage.getItem('openspec-workflow')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.currentPhase).toBe('design')
      expect(parsed.phaseContent.requirements).toBe('Test requirements content')
      expect(parsed.approvals.requirements).toBe('approved')
    })

    it('should load workflow state from localStorage', () => {
      localStorage.setItem('openspec-workflow', JSON.stringify(mockWorkflowState))

      const loaded = loadWorkflowState()

      expect(loaded).toEqual(mockWorkflowState)
    })

    it('should return null when no workflow state exists', () => {
      const loaded = loadWorkflowState()

      expect(loaded).toBeNull()
    })

    it('should return null when workflow state is invalid JSON', () => {
      localStorage.setItem('openspec-workflow', 'invalid-json')

      const loaded = loadWorkflowState()

      expect(loaded).toBeNull()
    })

    it('should clear workflow state from localStorage', () => {
      localStorage.setItem('openspec-workflow', JSON.stringify(mockWorkflowState))

      clearWorkflowState()

      expect(localStorage.getItem('openspec-workflow')).toBeNull()
    })

    it('should handle workflow state with missing fields', () => {
      const partialState = {
        currentPhase: 'requirements',
        phaseContent: {
          requirements: 'Test'
        }
      }
      localStorage.setItem('openspec-workflow', JSON.stringify(partialState))

      const loaded = loadWorkflowState()

      expect(loaded).toEqual(partialState)
    })
  })

  describe('API Key Management', () => {
    const mockApiKey = 'test-api-key-12345'

    it('should save API key to sessionStorage', () => {
      saveApiKey(mockApiKey)

      const saved = sessionStorage.getItem('openspec-api-key')
      expect(saved).toBe(mockApiKey)
    })

    it('should load API key from sessionStorage', () => {
      sessionStorage.setItem('openspec-api-key', mockApiKey)

      const loaded = loadApiKey()

      expect(loaded).toBe(mockApiKey)
    })

    it('should return null when no API key exists', () => {
      const loaded = loadApiKey()

      expect(loaded).toBeNull()
    })

    it('should clear API key from sessionStorage', () => {
      sessionStorage.setItem('openspec-api-key', mockApiKey)

      clearApiKey()

      expect(sessionStorage.getItem('openspec-api-key')).toBeNull()
    })

    it('should handle empty API key', () => {
      saveApiKey('')

      const loaded = loadApiKey()

      expect(loaded).toBe('')
    })
  })

  describe('Uploaded Files Management', () => {
    const mockFiles = [
      {
        name: 'test1.ts',
        type: 'text/typescript',
        size: 1024,
        content: 'console.log("test")',
        lastModified: Date.now()
      },
      {
        name: 'test2.md',
        type: 'text/markdown',
        size: 512,
        content: '# Test Document',
        lastModified: Date.now()
      }
    ]

    it('should save uploaded files to localStorage', () => {
      saveUploadedFiles(mockFiles)

      const saved = localStorage.getItem('openspec-uploaded-files')
      expect(saved).toBeTruthy()

      const parsed = JSON.parse(saved!)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('test1.ts')
      expect(parsed[1].name).toBe('test2.md')
    })

    it('should load uploaded files from localStorage', () => {
      localStorage.setItem('openspec-uploaded-files', JSON.stringify(mockFiles))

      const loaded = loadUploadedFiles()

      expect(loaded).toEqual(mockFiles)
    })

    it('should return empty array when no uploaded files exist', () => {
      const loaded = loadUploadedFiles()

      expect(loaded).toEqual([])
    })

    it('should return empty array when uploaded files data is invalid', () => {
      localStorage.setItem('openspec-uploaded-files', 'invalid-json')

      const loaded = loadUploadedFiles()

      expect(loaded).toEqual([])
    })

    it('should clear uploaded files from localStorage', () => {
      localStorage.setItem('openspec-uploaded-files', JSON.stringify(mockFiles))

      clearUploadedFiles()

      expect(localStorage.getItem('openspec-uploaded-files')).toBeNull()
    })

    it('should handle large file lists', () => {
      const largeFileList = Array.from({ length: 100 }, (_, i) => ({
        name: `file${i}.txt`,
        type: 'text/plain',
        size: 100 * i,
        content: `Content ${i}`,
        lastModified: Date.now() + i
      }))

      saveUploadedFiles(largeFileList)
      const loaded = loadUploadedFiles()

      expect(loaded).toHaveLength(100)
      expect(loaded[99].name).toBe('file99.txt')
    })

    it('should handle files with special characters in names', () => {
      const specialFiles = [
        {
          name: 'file with spaces.txt',
          type: 'text/plain',
          size: 100,
          content: 'test',
          lastModified: Date.now()
        },
        {
          name: 'file-with-unicode-é.txt',
          type: 'text/plain',
          size: 100,
          content: 'test',
          lastModified: Date.now()
        }
      ]

      saveUploadedFiles(specialFiles)
      const loaded = loadUploadedFiles()

      expect(loaded).toEqual(specialFiles)
    })
  })

  describe('Storage Size Limits', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw error
      expect(() => {
        saveWorkflowState({
          currentPhase: 'requirements',
          phaseContent: { requirements: '', design: '', tasks: '' },
          approvals: { requirements: 'pending', design: 'pending', tasks: 'pending' },
          isGenerating: false,
          lastUpdated: new Date().toISOString()
        })
      }).not.toThrow()

      // Restore original implementation
      localStorage.setItem = originalSetItem
    })

    it('should handle sessionStorage quota exceeded gracefully', () => {
      // Mock sessionStorage to throw QuotaExceededError
      const originalSetItem = sessionStorage.setItem
      sessionStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw error
      expect(() => {
        saveApiKey('test-key')
      }).not.toThrow()

      // Restore original implementation
      sessionStorage.setItem = originalSetItem
    })
  })

  describe('Storage Event Handling', () => {
    it('should handle storage events from other tabs', () => {
      const mockWorkflowState = {
        currentPhase: 'design' as const,
        phaseContent: { requirements: 'Updated from other tab', design: '', tasks: '' },
        approvals: { requirements: 'approved' as const, design: 'pending' as const, tasks: 'pending' as const },
        isGenerating: false,
        lastUpdated: new Date().toISOString()
      }

      // Simulate storage event from another tab
      localStorage.setItem('openspec-workflow', JSON.stringify(mockWorkflowState))
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'openspec-workflow',
        newValue: JSON.stringify(mockWorkflowState),
        storageArea: localStorage
      }))

      const loaded = loadWorkflowState()
      expect(loaded?.phaseContent.requirements).toBe('Updated from other tab')
    })

    it('should handle storage clear events', () => {
      localStorage.setItem('openspec-workflow', JSON.stringify({ test: 'data' }))
      
      localStorage.clear()
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: null,
        newValue: null,
        oldValue: null,
        storageArea: localStorage
      }))

      const loaded = loadWorkflowState()
      expect(loaded).toBeNull()
    })
  })

  describe('Data Migration', () => {
    it('should handle legacy storage format migration', () => {
      // Simulate old storage format
      const legacyData = {
        phase: 'requirements',
        content: 'Legacy content',
        status: 'approved'
      }
      localStorage.setItem('openspec-legacy-workflow', JSON.stringify(legacyData))

      // Migration would happen here in real implementation
      const loaded = loadWorkflowState()
      
      // Should return null for non-existent new format
      expect(loaded).toBeNull()
    })
  })
})