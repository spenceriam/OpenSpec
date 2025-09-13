import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelSelector from '@/components/ModelSelector'

// Mock the model utilities
jest.mock('@/lib/openrouter/models', () => ({
  listAvailableModels: jest.fn(),
  getModelCapabilities: jest.fn(),
  formatModelInfo: jest.fn()
}))

describe('ModelSelector Component', () => {
  const mockOnModelSelect = jest.fn()
  const { listAvailableModels, getModelCapabilities, formatModelInfo } = require('@/lib/openrouter/models')

  const mockModels = [
    {
      id: 'anthropic/claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      pricing: { prompt: '0.000015', completion: '0.000075' },
      context_length: 200000,
      architecture: { modality: 'text' }
    },
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      pricing: { prompt: '0.00001', completion: '0.00003' },
      context_length: 128000,
      architecture: { modality: 'text->text' }
    },
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      pricing: { prompt: '0.00000025', completion: '0.00000125' },
      context_length: 200000,
      architecture: { modality: 'text' }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    listAvailableModels.mockResolvedValue(mockModels)
    getModelCapabilities.mockImplementation((model) => ({
      hasVision: model.architecture.modality.includes('image'),
      supportsStreaming: true,
      maxContextLength: model.context_length
    }))
    formatModelInfo.mockImplementation((model) => ({
      displayName: model.name,
      provider: model.id.split('/')[0],
      costPer1k: parseFloat(model.pricing.prompt) * 1000
    }))
  })

  const defaultProps = {
    selectedModel: null,
    onModelSelect: mockOnModelSelect
  }

  it('should render with loading state initially', () => {
    render(<ModelSelector {...defaultProps} />)

    expect(screen.getByText(/loading models.../i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('should load and display models', async () => {
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/select a model/i)).toBeInTheDocument()
    })

    expect(listAvailableModels).toHaveBeenCalled()
    expect(screen.getByRole('combobox')).not.toBeDisabled()
  })

  it('should open dropdown and show models when clicked', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument()
    expect(screen.getByText('Claude 3 Haiku')).toBeInTheDocument()
  })

  it('should filter models by search query', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))
    
    const searchInput = screen.getByPlaceholderText(/search models.../i)
    await user.type(searchInput, 'claude')

    await waitFor(() => {
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
      expect(screen.getByText('Claude 3 Haiku')).toBeInTheDocument()
      expect(screen.queryByText('GPT-4 Turbo')).not.toBeInTheDocument()
    })
  })

  it('should select a model and call onModelSelect', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Claude 3 Sonnet'))

    expect(mockOnModelSelect).toHaveBeenCalledWith(mockModels[0])
    expect(screen.getByDisplayValue(/claude 3 sonnet/i)).toBeInTheDocument()
  })

  it('should display selected model with proper formatting', () => {
    const selectedModel = mockModels[0]
    render(<ModelSelector {...defaultProps} selectedModel={selectedModel} />)

    expect(screen.getByDisplayValue(/claude 3 sonnet/i)).toBeInTheDocument()
  })

  it('should show model capabilities as badges', async () => {
    const user = userEvent.setup()
    getModelCapabilities.mockReturnValue({
      hasVision: true,
      supportsStreaming: true,
      maxContextLength: 200000
    })

    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText(/200k context/i)).toBeInTheDocument()
    expect(screen.getByText(/vision/i)).toBeInTheDocument()
    expect(screen.getByText(/streaming/i)).toBeInTheDocument()
  })

  it('should display pricing information', async () => {
    const user = userEvent.setup()
    formatModelInfo.mockReturnValue({
      displayName: 'Claude 3 Sonnet',
      provider: 'anthropic',
      costPer1k: 0.015
    })

    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText(/\$0\.015\/1k tokens/i)).toBeInTheDocument()
  })

  it('should group models by provider', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText(/anthropic/i)).toBeInTheDocument()
    expect(screen.getByText(/openai/i)).toBeInTheDocument()
  })

  it('should show no results message when search returns empty', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))
    
    const searchInput = screen.getByPlaceholderText(/search models.../i)
    await user.type(searchInput, 'nonexistent-model')

    await waitFor(() => {
      expect(screen.getByText(/no models found/i)).toBeInTheDocument()
    })
  })

  it('should handle model loading errors', async () => {
    listAvailableModels.mockRejectedValue(new Error('Failed to load models'))
    
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load models/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('should retry loading models on error', async () => {
    const user = userEvent.setup()
    listAvailableModels.mockRejectedValueOnce(new Error('Network error'))
    listAvailableModels.mockResolvedValueOnce(mockModels)
    
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load models/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByText(/select a model/i)).toBeInTheDocument()
    })
  })

  it('should clear selection when clear button is clicked', async () => {
    const user = userEvent.setup()
    const selectedModel = mockModels[0]
    render(<ModelSelector {...defaultProps} selectedModel={selectedModel} />)

    const clearButton = screen.getByRole('button', { name: /clear selection/i })
    await user.click(clearButton)

    expect(mockOnModelSelect).toHaveBeenCalledWith(null)
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    const combobox = screen.getByRole('combobox')
    combobox.focus()

    await user.keyboard('{Enter}')
    expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(mockOnModelSelect).toHaveBeenCalled()
  })

  it('should show model recommendations based on use case', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText(/recommended for spec generation/i)).toBeInTheDocument()
    expect(screen.getByText(/best value/i)).toBeInTheDocument()
  })

  it('should display model performance indicators', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText(/fast/i)).toBeInTheDocument()
    expect(screen.getByText(/high quality/i)).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA attributes', async () => {
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox')

    fireEvent.click(combobox)
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
  })

  it('should handle model information tooltips', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    const infoButton = screen.getByRole('button', { name: /more info/i })
    await user.hover(infoButton)

    await waitFor(() => {
      expect(screen.getByText(/context length.*200,000 tokens/i)).toBeInTheDocument()
    })
  })

  it('should preserve selection when component re-renders', async () => {
    const selectedModel = mockModels[0]
    const { rerender } = render(<ModelSelector {...defaultProps} selectedModel={selectedModel} />)

    expect(screen.getByDisplayValue(/claude 3 sonnet/i)).toBeInTheDocument()

    rerender(<ModelSelector {...defaultProps} selectedModel={selectedModel} />)

    expect(screen.getByDisplayValue(/claude 3 sonnet/i)).toBeInTheDocument()
  })

  it('should handle rapid consecutive selections', async () => {
    const user = userEvent.setup()
    render(<ModelSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    await user.click(screen.getByRole('combobox'))

    // Rapidly select different models
    await user.click(screen.getByText('Claude 3 Sonnet'))
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('GPT-4 Turbo'))

    expect(mockOnModelSelect).toHaveBeenCalledTimes(2)
    expect(mockOnModelSelect).toHaveBeenLastCalledWith(mockModels[1])
  })
})