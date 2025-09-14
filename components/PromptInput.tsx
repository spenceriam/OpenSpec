'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Code, 
  X, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Download,
  FileIcon
} from 'lucide-react'
import { ContextFile } from '@/types'

interface PromptInputProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  contextFiles: ContextFile[]
  onFilesChange: (files: ContextFile[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  placeholder?: string
  minLength?: number
  maxLength?: number
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/javascript',
  'text/typescript',
  'text/html',
  'text/css',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
]

export function PromptInput({
  prompt,
  onPromptChange,
  contextFiles,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 10, // 10MB
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  placeholder = "Describe the feature or system you want to create a specification for...",
  minLength = 10,
  maxLength = 5000,
  className = ''
}: PromptInputProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height based on scroll height, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 128), 300)
      textarea.style.height = `${newHeight}px`
    }
  }, [prompt])

  // Handle paste events with files
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile()
          if (file) {
            files.push(file)
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        await handleFileSelection(files)
      }
    }
  }, [contextFiles, onFilesChange, maxFiles, maxFileSize, acceptedTypes])

  // Calculate total file size
  const totalFileSize = contextFiles.reduce((total, file) => total + file.size, 0)

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFileSelection(files)
  }, [])

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    if (!acceptedTypes.includes(file.type) && 
        !acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.split('/')[1]))) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    // Check total file count
    if (contextFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`
    }

    // Check for duplicate names
    if (contextFiles.some(f => f.name === file.name)) {
      return `File with name "${file.name}" already exists`
    }

    return null
  }

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('Failed to read file content'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      
      // Handle different file types
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file, 'UTF-8')
      }
    })
  }

  // Handle file selection
  const handleFileSelection = useCallback(async (files: File[]) => {
    const newFiles: ContextFile[] = []
    const errors: Record<string, string> = {}
    const progress: Record<string, number> = {}

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`
      
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        errors[fileId] = validationError
        continue
      }

      // Initialize progress
      progress[fileId] = 0
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

      try {
        // Simulate progressive loading
        const intervals = [20, 40, 60, 80, 95, 100]
        for (const percent of intervals) {
          progress[fileId] = percent
          setUploadProgress(prev => ({ ...prev, [fileId]: percent }))
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Read file content
        const content = await readFileContent(file)
        
        // Create context file object
        const contextFile: ContextFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          uploadedAt: new Date().toISOString()
        }

        newFiles.push(contextFile)
        
        // Complete progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
        
      } catch (error) {
        errors[fileId] = error instanceof Error ? error.message : 'Failed to process file'
      }
    }

    // Update files and errors
    if (newFiles.length > 0) {
      onFilesChange([...contextFiles, ...newFiles])
    }
    
    setFileErrors(errors)
    
    // Clear progress after delay
    setTimeout(() => {
      setUploadProgress({})
    }, 1000)
    
  }, [contextFiles, onFilesChange, maxFiles, maxFileSize, acceptedTypes])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(Array.from(e.target.files))
      // Clear input so same file can be selected again
      e.target.value = ''
    }
  }

  // Remove file
  const removeFile = (fileId: string) => {
    onFilesChange(contextFiles.filter(f => f.id !== fileId))
    
    // Remove any associated errors
    const newErrors = { ...fileErrors }
    delete newErrors[fileId]
    setFileErrors(newErrors)
  }

  // Get file icon
  const getFileIcon = (file: ContextFile) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.includes('json') || 
        file.type.includes('javascript') || 
        file.type.includes('typescript') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.tsx')) return <Code className="h-4 w-4" />
    if (file.type.includes('text') || 
        file.type.includes('markdown')) return <FileText className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Preview file content
  const previewFile = (file: ContextFile) => {
    if (file.type.startsWith('image/')) {
      // Open image in new window
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`<img src="${file.content}" style="max-width: 100%; height: auto;" />`)
      }
    } else {
      // Show text content in modal or new window
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${file.name}</title></head>
            <body>
              <h2>${file.name}</h2>
              <pre style="white-space: pre-wrap; font-family: monospace;">${file.content}</pre>
            </body>
          </html>
        `)
      }
    }
  }

  const isPromptValid = prompt.length >= minLength && prompt.length <= maxLength
  const remainingFiles = maxFiles - contextFiles.length

  return (
    <Card className={`prompt-input ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Feature Description & Context</CardTitle>
        <CardDescription>
          Describe what you want to build and optionally upload context files to help the AI understand your requirements better.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="feature-description" className="text-sm font-medium">Feature Description</label>
            <div className={`text-xs ${isPromptValid ? 'text-muted-foreground' : 'text-destructive'}`}>
              {prompt.length}/{maxLength} characters 
              {prompt.length < minLength && ` (minimum ${minLength})`}
            </div>
          </div>
          
          <Textarea
            ref={textareaRef}
            id="feature-description"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="min-h-24 resize-none overflow-hidden"
            maxLength={maxLength}
          />
          
          {/* Character limit warnings */}
          {prompt.length > maxLength * 0.9 && prompt.length < maxLength && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Approaching character limit: {prompt.length}/{maxLength} characters
              </AlertDescription>
            </Alert>
          )}
          
          {!isPromptValid && prompt.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {prompt.length < minLength 
                  ? `Description must be at least ${minLength} characters long`
                  : `Description cannot exceed ${maxLength} characters`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* File upload area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="context-files" className="text-sm font-medium">Context Files (Optional)</label>
            <div className="text-xs text-muted-foreground">
              {contextFiles.length}/{maxFiles} files • {remainingFiles} remaining
              {contextFiles.length > 0 && (
                <span className="ml-2">• Total: {formatFileSize(totalFileSize)}</span>
              )}
            </div>
          </div>

          {/* Upload dropzone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
              ${remainingFiles === 0 ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              id="context-files"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              disabled={remainingFiles === 0}
              aria-label="Upload files"
            />
            
            <Upload className={`h-6 w-6 mx-auto mb-1 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {isDragOver ? 'Drop files to upload' : 'Click to upload or drag and drop'}
              </div>
              <div className="text-xs text-muted-foreground">
                Supports: code files, documents, images (max {maxFileSize}MB each)
              </div>
            </div>
          </div>

          {/* File list */}
          {contextFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Uploaded Files</div>
              <div className="space-y-2">
                {contextFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getFileIcon(file)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                      
                      {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 ? (
                        <div className="mt-1">
                          <Progress value={uploadProgress[file.id]} className="h-2" />
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFile(file)}
                        className="h-8 w-8 p-0"
                        aria-label={`Preview ${file.name}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File errors */}
          {Object.keys(fileErrors).length > 0 && (
            <div className="space-y-2">
              {Object.entries(fileErrors).map(([fileId, error]) => (
                <Alert key={fileId} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newErrors = { ...fileErrors }
                          delete newErrors[fileId]
                          setFileErrors(newErrors)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Upload guidelines */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Upload code files, documentation, or images for better context</div>
            <div>• Files are processed locally and included in your API requests</div>
            <div>• Supported formats: .txt, .md, .json, .js, .ts, .html, .css, .png, .jpg, .pdf</div>
            <div>• Maximum file size: {maxFileSize}MB per file</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PromptInput