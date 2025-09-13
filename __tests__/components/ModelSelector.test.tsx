import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelSelector from '@/components/ModelSelector'

// Mock the session storage hook
jest.mock('@/hooks/useSessionStorage', () => ({
  useAPIKeyStorage: jest.fn(() => ({ value: 'test-api-key' }))
}))

// Mock the OpenRouter client
jest.mock('@/lib/openrouter/client', () => ({
  OpenRouterClient: jest.fn().mockImplementation(() => ({
    getAvailableModels: jest.fn()
  }))
}))

describe('ModelSelector Component', () => {
  const mockOnModelSelect = jest.fn()
  const { useAPIKeyStorage } = require('@/hooks/useSessionStorage')
  const { OpenRouterClient } = require('@/lib/openrouter/client')

  const mockModels = [
    {
      id: 'anthropic/claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      pricing: { prompt: 0.000015, completion: 0.000075 },
      context_length: 200000,
      architecture: { modality: ['text'] },
      top_provider: { popularity: 85, provider_name: 'Anthropic' },
      description: 'High-performance model for complex reasoning tasks'
    },
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      pricing: { prompt: 0.00001, completion: 0.00003 },
      context_length: 128000,
      architecture: { modality: ['text', 'vision'] },
      top_provider: { popularity: 95, provider_name: 'OpenAI' },
      description: 'Latest GPT-4 model with vision capabilities'
    }
  ]

  let mockGetAvailableModels: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGetAvailableModels = jest.fn().mockResolvedValue(mockModels)
    OpenRouterClient.mockImplementation(() => ({
      getAvailableModels: mockGetAvailableModels
    }))
    
    useAPIKeyStorage.mockReturnValue({ value: 'test-api-key' })
  })

  const defaultProps = {
    selectedModel: undefined,
    onModelSelect: mockOnModelSelect
  }

  it('should render with API key warning when no API key provided', () => {
    useAPIKeyStorage.mockReturnValue({ value: null })
    render(<ModelSelector {...defaultProps} />)

    expect(screen.getByText(/please enter your openrouter api key/i)).toBeInTheDocument()
  })

  it('should load and display models with API key', async () => {
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/select a model/i)).toBeInTheDocument()
    })

    expect(mockGetAvailableModels).toHaveBeenCalled()
  })

  it('should display selected model when provided', async () => {
    const selectedModel = mockModels[0]
    render(<ModelSelector {...defaultProps} selectedModel={selectedModel} />)

    await waitFor(() => {
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
    })
  })

  it('should show model selector button', async () => {
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /select a model/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })
  })

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select a model/i })).not.toBeDisabled()
    })

    const button = screen.getByRole('button', { name: /select a model/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument()
    })
  })

  it('should handle model selection', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select a model/i })).not.toBeDisabled()
    })

    const button = screen.getByRole('button', { name: /select a model/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
    })

    const modelOption = screen.getByText('Claude 3 Sonnet')
    await user.click(modelOption)

    expect(mockOnModelSelect).toHaveBeenCalledWith(mockModels[0])
  })

  it('should handle loading errors', async () => {
    mockGetAvailableModels.mockRejectedValue(new Error('API Error'))
    
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    render(<ModelSelector {...defaultProps} />)
    
    expect(screen.getByText(/loading models/i)).toBeInTheDocument()
  })

  it('should show model count when models are loaded', async () => {
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/choose from 2 available ai models/i)).toBeInTheDocument()
    })
  })
})