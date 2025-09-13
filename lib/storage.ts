export interface WorkflowState {
  currentPhase: 'requirements' | 'design' | 'tasks'
  phaseContent: {
    requirements: string
    design: string
    tasks: string
  }
  approvals: {
    requirements: 'pending' | 'approved' | 'rejected'
    design: 'pending' | 'approved' | 'rejected'
    tasks: 'pending' | 'approved' | 'rejected'
  }
  isGenerating: boolean
  lastUpdated: string
}

export interface UploadedFile {
  name: string
  type: string
  size: number
  content: string
  lastModified: number
}

// Workflow state management
export function saveWorkflowState(state: WorkflowState): void {
  try {
    localStorage.setItem('openspec-workflow', JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save workflow state:', error)
  }
}

export function loadWorkflowState(): WorkflowState | null {
  try {
    const saved = localStorage.getItem('openspec-workflow')
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.warn('Failed to load workflow state:', error)
    return null
  }
}

export function clearWorkflowState(): void {
  try {
    localStorage.removeItem('openspec-workflow')
  } catch (error) {
    console.warn('Failed to clear workflow state:', error)
  }
}

// API key management
export function saveApiKey(apiKey: string): void {
  try {
    sessionStorage.setItem('openspec-api-key', apiKey)
  } catch (error) {
    console.warn('Failed to save API key:', error)
  }
}

export function loadApiKey(): string | null {
  try {
    return sessionStorage.getItem('openspec-api-key')
  } catch (error) {
    console.warn('Failed to load API key:', error)
    return null
  }
}

export function clearApiKey(): void {
  try {
    sessionStorage.removeItem('openspec-api-key')
  } catch (error) {
    console.warn('Failed to clear API key:', error)
  }
}

// Uploaded files management
export function saveUploadedFiles(files: UploadedFile[]): void {
  try {
    localStorage.setItem('openspec-uploaded-files', JSON.stringify(files))
  } catch (error) {
    console.warn('Failed to save uploaded files:', error)
  }
}

export function loadUploadedFiles(): UploadedFile[] {
  try {
    const saved = localStorage.getItem('openspec-uploaded-files')
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.warn('Failed to load uploaded files:', error)
    return []
  }
}

export function clearUploadedFiles(): void {
  try {
    localStorage.removeItem('openspec-uploaded-files')
  } catch (error) {
    console.warn('Failed to clear uploaded files:', error)
  }
}