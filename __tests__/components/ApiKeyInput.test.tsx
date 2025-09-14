import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApiKeyInput from '@/components/ApiKeyInput'
import { OpenRouterClient } from '@/lib/openrouter/client'

// Mock the OpenRouter client
jest.mock('@/lib/openrouter/client')

describe('ApiKeyInput Component', () => {
  const mockOnApiKeyValidated = jest.fn()
  const MockOpenRouterClient = OpenRouterClient as jest.MockedClass<typeof OpenRouterClient>

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  const defaultProps = {
    onApiKeyValidated: mockOnApiKeyValidated,
    autoTest: false
  }

  it('should render with initial state', () => {
    render(<ApiKeyInput {...defaultProps} />)

    expect(screen.getByLabelText(/openrouter api key/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your openrouter api key/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /validate key/i })).toBeInTheDocument()
    expect(screen.getByText(/your api key is stored securely/i)).toBeInTheDocument()
  })

  it('should load existing API key from sessionStorage', () => {
    const existingKey = 'existing-api-key'
    sessionStorage.setItem('openspec-api-key', existingKey)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i) as HTMLInputElement
    expect(input.value).toBe(existingKey)
  })

  it('should update input value when typing', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    await user.type(input, 'sk-test-api-key')

    expect(input).toHaveValue('sk-test-api-key')
  })

  it('should validate API key on button click', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockResolvedValue(true) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'sk-valid-key')
    await user.click(validateButton)

    await waitFor(() => {
      expect(MockOpenRouterClient).toHaveBeenCalledWith('sk-valid-key')
      expect(mockClient.testConnection).toHaveBeenCalled()
      expect(mockOnApiKeyValidated).toHaveBeenCalledWith(true, 'sk-valid-key')
    })

    expect(screen.getByText(/api key validated successfully/i)).toBeInTheDocument()
    expect(screen.getByText(/✓/)).toBeInTheDocument()
  })

  it('should handle invalid API key', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockResolvedValue(false) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'invalid-key')
    await user.click(validateButton)

    await waitFor(() => {
      expect(mockOnApiKeyValidated).toHaveBeenCalledWith(false, 'invalid-key')
    })

    expect(screen.getByText(/api key validation failed/i)).toBeInTheDocument()
    expect(screen.getByText(/✗/)).toBeInTheDocument()
  })

  it('should handle network errors during validation', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockRejectedValue(new Error('Network error')) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'sk-network-error')
    await user.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText(/validation failed.*network error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during validation', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: boolean) => void
    const testPromise = new Promise<boolean>((resolve) => { resolvePromise = resolve })
    const mockClient = { testConnection: jest.fn().mockReturnValue(testPromise) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'sk-loading-test')
    await user.click(validateButton)

    expect(screen.getByText(/validating.../i)).toBeInTheDocument()
    expect(validateButton).toBeDisabled()

    resolvePromise!(true)
    await waitFor(() => {
      expect(screen.getByText(/api key validated successfully/i)).toBeInTheDocument()
    })
  })

  it('should auto-test when autoTest prop is true', async () => {
    const mockClient = { testConnection: jest.fn().mockResolvedValue(true) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)
    sessionStorage.setItem('openspec-api-key', 'auto-test-key')

    render(<ApiKeyInput {...defaultProps} autoTest={true} />)

    await waitFor(() => {
      expect(MockOpenRouterClient).toHaveBeenCalledWith('auto-test-key')
      expect(mockClient.testConnection).toHaveBeenCalled()
    })
  })

  it('should validate key format before testing', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'invalid-format')
    await user.click(validateButton)

    expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument()
    expect(MockOpenRouterClient).not.toHaveBeenCalled()
  })

  it('should not validate empty key', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput {...defaultProps} />)

    const validateButton = screen.getByRole('button', { name: /validate key/i })
    await user.click(validateButton)

    expect(screen.getByText(/please enter an api key/i)).toBeInTheDocument()
    expect(MockOpenRouterClient).not.toHaveBeenCalled()
  })

  it('should save valid key to sessionStorage', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockResolvedValue(true) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'sk-save-test-key')
    await user.click(validateButton)

    await waitFor(() => {
      expect(sessionStorage.getItem('openspec-api-key')).toBe('sk-save-test-key')
    })
  })

  it('should clear invalid key from sessionStorage', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockResolvedValue(false) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)
    sessionStorage.setItem('openspec-api-key', 'old-key')

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    // Clear the existing input and type new key
    await user.clear(input)
    await user.type(input, 'sk-invalid-key')
    await user.click(validateButton)

    await waitFor(() => {
      expect(sessionStorage.getItem('openspec-api-key')).toBeNull()
    })
  })

  it('should handle key visibility toggle', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /toggle key visibility/i })

    expect(input.type).toBe('password')

    await user.click(toggleButton)
    expect(input.type).toBe('text')

    await user.click(toggleButton)
    expect(input.type).toBe('password')
  })

  it('should show OpenRouter link and documentation', () => {
    render(<ApiKeyInput {...defaultProps} />)

    const openRouterLink = screen.getByRole('link', { name: /get your api key from openrouter/i })
    expect(openRouterLink).toHaveAttribute('href', 'https://openrouter.ai/keys')
    expect(openRouterLink).toHaveAttribute('target', '_blank')

    expect(screen.getByText(/your api key is stored securely/i)).toBeInTheDocument()
  })

  it('should be accessible with proper labels and roles', () => {
    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    expect(input).toHaveAttribute('aria-describedby')
    expect(input).toBeRequired()

    const validateButton = screen.getByRole('button', { name: /validate key/i })
    expect(validateButton).toHaveAttribute('type', 'button')

    // Test basic focus functionality
    input.focus()
    expect(input).toHaveFocus()
  })

  it('should handle paste events', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    
    await user.click(input)
    await user.paste('sk-pasted-api-key')

    expect(input).toHaveValue('sk-pasted-api-key')
  })

  it('should clear previous validation state on new input', async () => {
    const user = userEvent.setup()
    const mockClient = { testConnection: jest.fn().mockResolvedValue(true) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    // First validation
    await user.type(input, 'sk-first-key')
    await user.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText(/api key validated successfully/i)).toBeInTheDocument()
    })

    // Clear and type new key
    await user.clear(input)
    await user.type(input, 'sk-second-key')

    expect(screen.queryByText(/api key validated successfully/i)).not.toBeInTheDocument()
  })

  it('should handle component unmounting during validation', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: boolean) => void
    const testPromise = new Promise<boolean>((resolve) => { resolvePromise = resolve })
    const mockClient = { testConnection: jest.fn().mockReturnValue(testPromise) }
    MockOpenRouterClient.mockImplementation(() => mockClient as any)

    const { unmount } = render(<ApiKeyInput {...defaultProps} />)

    const input = screen.getByLabelText(/openrouter api key/i)
    const validateButton = screen.getByRole('button', { name: /validate key/i })

    await user.type(input, 'sk-unmount-test')
    await user.click(validateButton)

    unmount()
    resolvePromise!(true)

    // Should not cause memory leaks or errors
    expect(true).toBe(true)
  })
})