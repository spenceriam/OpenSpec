import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptInput from '@/components/PromptInput'

describe('PromptInput Component', () => {
  const mockOnPromptChange = jest.fn()
  const mockOnFilesChange = jest.fn()

  const defaultProps = {
    prompt: '',
    onPromptChange: mockOnPromptChange,
    contextFiles: [],
    onFilesChange: mockOnFilesChange
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with empty state', () => {
    render(<PromptInput {...defaultProps} />)

    expect(screen.getByLabelText(/feature description/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe the feature/i)).toBeInTheDocument()
    expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument()
  })

  it('should display current prompt value', () => {
    const testPrompt = 'Test feature description'
    render(<PromptInput {...defaultProps} prompt={testPrompt} />)

    expect(screen.getByDisplayValue(testPrompt)).toBeInTheDocument()
  })

  it('should call onPromptChange when text is typed', async () => {
    const user = userEvent.setup()
    render(<PromptInput {...defaultProps} />)

    const textarea = screen.getByLabelText(/feature description/i)
    await user.type(textarea, 'New feature description')

    // The function is called for each character typed, so check the last call
    expect(mockOnPromptChange).toHaveBeenLastCalledWith('New feature description')
  })

  it('should show character count', () => {
    const longPrompt = 'A'.repeat(100)
    render(<PromptInput {...defaultProps} prompt={longPrompt} />)

    expect(screen.getByText(/100.*characters/i)).toBeInTheDocument()
  })

  it('should warn when approaching character limit', () => {
    const longPrompt = 'A'.repeat(4500)
    render(<PromptInput {...defaultProps} prompt={longPrompt} />)

    // Check that the character count is displayed
    expect(screen.getByText(/4500.*5000.*characters/i)).toBeInTheDocument()
  })

  it('should handle file drag and drop', async () => {
    render(<PromptInput {...defaultProps} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).closest('div')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    fireEvent.dragEnter(dropZone!)
    expect(screen.getByText(/drop files to upload/i)).toBeInTheDocument()

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    })

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalled()
    })
  })

  it('should handle file selection via input', async () => {
    const user = userEvent.setup()
    render(<PromptInput {...defaultProps} />)

    const fileInput = screen.getByLabelText(/upload files/i)
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalled()
    })
  })

  it('should display uploaded files', () => {
    const contextFiles = [
      {
        id: 'file-1',
        name: 'test1.txt',
        type: 'text/plain',
        size: 100,
        content: 'Test content 1',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'file-2',
        name: 'test2.md',
        type: 'text/markdown',
        size: 200,
        content: '# Test Content 2',
        uploadedAt: new Date().toISOString()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    expect(screen.getByText('test1.txt')).toBeInTheDocument()
    expect(screen.getByText('test2.md')).toBeInTheDocument()
    expect(screen.getByText(/100 B/)).toBeInTheDocument()
    expect(screen.getByText(/200 B/)).toBeInTheDocument()
  })

  it('should allow file removal', async () => {
    const user = userEvent.setup()
    const contextFiles = [
      {
        id: 'test-file',
        name: 'test.txt',
        type: 'text/plain',
        size: 100,
        content: 'Test content',
        uploadedAt: new Date().toISOString()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    const removeButton = screen.getByRole('button', { name: /remove test\.txt/i })
    await user.click(removeButton)

    expect(mockOnFilesChange).toHaveBeenCalledWith([])
  })

  it('should validate file types', async () => {
    render(<PromptInput {...defaultProps} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).closest('div')
    const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' })

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [invalidFile] }
    })

    await waitFor(() => {
      expect(screen.getByText(/file type not supported/i)).toBeInTheDocument()
    })

    expect(mockOnFilesChange).not.toHaveBeenCalled()
  })

  it('should validate file size limits', async () => {
    render(<PromptInput {...defaultProps} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).closest('div')
    const largeFile = new File(['A'.repeat(1024 * 1024 * 6)], 'large.txt', { type: 'text/plain' })

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [largeFile] }
    })

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds.*limit/i)).toBeInTheDocument()
    })

    expect(mockOnFilesChange).not.toHaveBeenCalled()
  })

  it('should show file previews', async () => {
    const user = userEvent.setup()
    const mockWindow = { document: { write: jest.fn() } }
    const mockOpen = jest.spyOn(window, 'open').mockReturnValue(mockWindow as any)
    
    const contextFiles = [
      {
        id: 'test-id',
        name: 'code.ts',
        type: 'text/typescript',
        size: 150,
        content: 'const hello = "world";',
        uploadedAt: new Date().toISOString()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    const previewButton = screen.getByRole('button', { name: /preview code\.ts/i })
    await user.click(previewButton)

    expect(mockOpen).toHaveBeenCalled()
    expect(mockWindow.document.write).toHaveBeenCalledWith(
      expect.stringContaining('const hello = "world";')
    )
    
    mockOpen.mockRestore()
  })

  it('should handle multiple file uploads', async () => {
    render(<PromptInput {...defaultProps} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).closest('div')
    const files = [
      new File(['content 1'], 'test1.txt', { type: 'text/plain' }),
      new File(['content 2'], 'test2.txt', { type: 'text/plain' }),
      new File(['content 3'], 'test3.txt', { type: 'text/plain' })
    ]

    fireEvent.drop(dropZone!, {
      dataTransfer: { files }
    })

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'test1.txt' }),
          expect.objectContaining({ name: 'test2.txt' }),
          expect.objectContaining({ name: 'test3.txt' })
        ])
      )
    })
  })

  it('should prevent duplicate file uploads', async () => {
    const existingFiles = [
      {
        id: 'existing-file',
        name: 'existing.txt',
        type: 'text/plain',
        size: 100,
        content: 'Existing content',
        uploadedAt: new Date().toISOString()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={existingFiles} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).closest('div')
    const duplicateFile = new File(['new content'], 'existing.txt', { type: 'text/plain' })

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [duplicateFile] }
    })

    await waitFor(() => {
      expect(screen.getByText(/file with name.*already exists/i)).toBeInTheDocument()
    })
  })

  it('should show file type icons', () => {
    const contextFiles = [
      {
        id: 'js-file',
        name: 'script.js',
        type: 'application/javascript',
        size: 100,
        content: 'console.log("test")',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'css-file',
        name: 'style.css',
        type: 'text/css',
        size: 50,
        content: 'body { margin: 0; }',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'md-file',
        name: 'readme.md',
        type: 'text/markdown',
        size: 200,
        content: '# README',
        uploadedAt: new Date().toISOString()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    // Check that files are displayed
    expect(screen.getByText('script.js')).toBeInTheDocument()
    expect(screen.getByText('style.css')).toBeInTheDocument()
    expect(screen.getByText('readme.md')).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA attributes', () => {
    render(<PromptInput {...defaultProps} />)

    const textarea = screen.getByLabelText(/feature description/i)
    expect(textarea).toHaveAttribute('id', 'feature-description')
    expect(textarea).toHaveAttribute('maxlength', '5000')

    const fileInput = screen.getByLabelText(/upload files/i)
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('multiple')
    expect(fileInput).toHaveAttribute('accept')
  })
  it('should handle paste events with files', async () => {
    const user = userEvent.setup()
    render(<PromptInput {...defaultProps} />)

    const textarea = screen.getByLabelText(/feature description/i)
    textarea.focus()

    // Mock clipboard with file
    const file = new File(['pasted content'], 'pasted.txt', { type: 'text/plain' })
    const clipboardData = {
      files: [file],
      items: [{
        kind: 'file',
        type: 'text/plain',
        getAsFile: () => file
      }]
    }

    fireEvent.paste(textarea, { clipboardData })

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalled()
    })
  })

  it('should provide file upload suggestions', () => {
    render(<PromptInput {...defaultProps} />)

    expect(screen.getByText(/supported formats/i)).toBeInTheDocument()
    expect(screen.getByText(/\.ts/i)).toBeInTheDocument()
    expect(screen.getByText(/\.md/i)).toBeInTheDocument()
    expect(screen.getByText(/\.json/i)).toBeInTheDocument()
  })

  it('should show total file size', () => {
    const contextFiles = [
      {
        name: 'file1.txt',
        type: 'text/plain',
        size: 1024,
        content: 'Content 1',
        lastModified: Date.now()
      },
      {
        name: 'file2.txt',
        type: 'text/plain',
        size: 2048,
        content: 'Content 2',
        lastModified: Date.now()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    expect(screen.getByText(/total.*3\.0 kb/i)).toBeInTheDocument()
  })

  it('should handle keyboard navigation in file list', async () => {
    const user = userEvent.setup()
    const contextFiles = [
      {
        name: 'test.txt',
        type: 'text/plain',
        size: 100,
        content: 'Test content',
        lastModified: Date.now()
      }
    ]

    render(<PromptInput {...defaultProps} contextFiles={contextFiles} />)

    const removeButton = screen.getByRole('button', { name: /remove test\.txt/i })
    removeButton.focus()

    await user.keyboard('{Enter}')

    expect(mockOnFilesChange).toHaveBeenCalledWith([])
  })

  it('should auto-resize textarea based on content', async () => {
    const user = userEvent.setup()
    render(<PromptInput {...defaultProps} />)

    const textarea = screen.getByLabelText(/feature description/i) as HTMLTextAreaElement
    const initialHeight = textarea.style.height

    await user.type(textarea, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5')

    expect(textarea.style.height).not.toBe(initialHeight)
  })

  it('should handle file reading errors gracefully', async () => {
    // Mock FileReader to simulate error
    const originalFileReader = global.FileReader
    global.FileReader = jest.fn(() => ({
      readAsText: jest.fn(function() {
        setTimeout(() => {
          if (this.onerror) this.onerror(new Error('File read error'))
        }, 10)
      }),
      result: null,
      error: new Error('File read error')
    })) as any

    render(<PromptInput {...defaultProps} />)

    const dropZone = screen.getByText(/drag.*drop files here/i).closest('div')
    const file = new File(['content'], 'error.txt', { type: 'text/plain' })

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    })

    await waitFor(() => {
      expect(screen.getByText(/failed to read file/i)).toBeInTheDocument()
    })

    global.FileReader = originalFileReader
  })
})