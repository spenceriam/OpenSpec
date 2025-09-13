import { OpenRouterClient } from '@/lib/openrouter/client'
import { OpenRouterError } from '@/lib/openrouter/errors'

// Note: These are integration tests that would test against the real OpenRouter API
// In a real scenario, these should use a test API key and be run separately from unit tests
// For now, we'll mock the fetch calls to simulate real API responses

describe('OpenRouter API Integration', () => {
  let client: OpenRouterClient
  const testApiKey = 'test-integration-api-key'

  beforeEach(() => {
    client = new OpenRouterClient(testApiKey)
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should successfully authenticate with valid API key', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] })
      })

      const result = await client.testConnection()

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testApiKey}`
          })
        })
      )
    })

    it('should handle invalid API key authentication failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key provided',
            type: 'authentication_error',
            code: 'invalid_api_key'
          }
        })
      })

      const result = await client.testConnection()

      expect(result).toBe(false)
    })

    it('should handle API key with insufficient permissions', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({
          error: {
            message: 'API key does not have required permissions',
            type: 'permission_error',
            code: 'insufficient_permissions'
          }
        })
      })

      await expect(client.listModels()).rejects.toThrow(OpenRouterError)
    })
  })

  describe('Model Listing Integration', () => {
    it('should fetch and parse model list successfully', async () => {
      const mockModelsResponse = {
        data: [
          {
            id: 'anthropic/claude-3-sonnet',
            name: 'Claude 3 Sonnet',
            description: 'Anthropic Claude 3 Sonnet model',
            context_length: 200000,
            architecture: {
              modality: 'text',
              tokenizer: 'claude',
              instruct_type: 'anthropic'
            },
            pricing: {
              prompt: '0.000015',
              completion: '0.000075'
            },
            top_provider: {
              context_length: 200000,
              max_completion_tokens: 4096
            }
          },
          {
            id: 'openai/gpt-4-turbo',
            name: 'GPT-4 Turbo',
            description: 'OpenAI GPT-4 Turbo model',
            context_length: 128000,
            architecture: {
              modality: 'text',
              tokenizer: 'gpt',
              instruct_type: 'openai'
            },
            pricing: {
              prompt: '0.00001',
              completion: '0.00003'
            },
            top_provider: {
              context_length: 128000,
              max_completion_tokens: 4096
            }
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModelsResponse)
      })

      const models = await client.listModels()

      expect(models).toHaveLength(2)
      expect(models[0].id).toBe('anthropic/claude-3-sonnet')
      expect(models[1].id).toBe('openai/gpt-4-turbo')
      expect(models[0].context_length).toBe(200000)
    })

    it('should handle empty model list response', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] })
      })

      const models = await client.listModels()

      expect(models).toEqual([])
    })

    it('should handle malformed model data gracefully', async () => {
      const malformedResponse = {
        data: [
          {
            id: 'incomplete/model',
            // Missing required fields
          },
          {
            id: 'anthropic/claude-3-haiku',
            name: 'Claude 3 Haiku',
            context_length: 200000,
            pricing: { prompt: '0.00000025', completion: '0.00000125' }
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(malformedResponse)
      })

      const models = await client.listModels()

      expect(models).toHaveLength(2)
      // Should still return the data, letting the application handle validation
    })
  })

  describe('Completion Generation Integration', () => {
    it('should generate completion for requirements phase', async () => {
      const mockCompletionResponse = {
        id: 'gen-test-123',
        model: 'anthropic/claude-3-sonnet',
        object: 'chat.completion',
        created: 1703123456,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `# Requirements Specification

## 1. Project Overview
Create a user authentication system for a web application.

## 2. Functional Requirements
- User registration with email validation
- Secure login/logout functionality
- Password reset capability
- Session management

## 3. Non-Functional Requirements
- Authentication must complete within 2 seconds
- System must support 1000 concurrent users
- Password storage must use bcrypt hashing

## 4. Acceptance Criteria
- Users can register with valid email addresses
- Passwords must meet complexity requirements
- Failed login attempts are rate-limited`
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 145,
          completion_tokens: 234,
          total_tokens: 379
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCompletionResponse)
      })

      const response = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Generate requirements for a user authentication system'
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })

      expect(response.choices[0].message.content).toContain('Requirements Specification')
      expect(response.choices[0].message.content).toContain('Functional Requirements')
      expect(response.usage.total_tokens).toBe(379)
    })

    it('should handle streaming completion responses', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"# Requirements"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" Specification\\n\\n"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"## 1. Overview\\n"}}]}\n\n',
        'data: [DONE]\n\n'
      ]

      const mockStream = new ReadableStream({
        start(controller) {
          streamChunks.forEach(chunk => {
            controller.enqueue(new TextEncoder().encode(chunk))
          })
          controller.close()
        }
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream,
        headers: new Headers({ 'content-type': 'text/event-stream' })
      })

      const response = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'Generate requirements' }],
        stream: true
      })

      expect(response).toBeDefined()
    })

    it('should handle context length exceeded error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: {
            message: 'This model\'s maximum context length is 200000 tokens. However, your messages resulted in 250000 tokens.',
            type: 'invalid_request_error',
            code: 'context_length_exceeded'
          }
        })
      })

      await expect(client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'A'.repeat(300000) }]
      })).rejects.toThrow(OpenRouterError)
    })

    it('should handle model not found error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({
          error: {
            message: 'The model `nonexistent/model` does not exist',
            type: 'invalid_request_error',
            code: 'model_not_found'
          }
        })
      })

      await expect(client.generateCompletion({
        model: 'nonexistent/model',
        messages: [{ role: 'user', content: 'test' }]
      })).rejects.toThrow(OpenRouterError)
    })
  })

  describe('Rate Limiting and Retry Logic', () => {
    it('should handle rate limiting with exponential backoff', async () => {
      const mockSuccessResponse = {
        choices: [{ message: { role: 'assistant', content: 'Success after retry' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'retry-after': '2' }),
          json: () => Promise.resolve({
            error: {
              message: 'Rate limit exceeded. Please try again in 2 seconds.',
              type: 'rate_limit_error',
              code: 'rate_limit_exceeded'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSuccessResponse)
        })

      const startTime = Date.now()
      const response = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'test after rate limit' }]
      })

      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThan(1000) // Should wait for retry
      expect(response.choices[0].message.content).toBe('Success after retry')
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after maximum retry attempts', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({
          error: {
            message: 'Service temporarily unavailable',
            type: 'server_error',
            code: 'service_unavailable'
          }
        })
      })

      await expect(client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'test' }]
      })).rejects.toThrow(OpenRouterError)

      expect(fetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network connectivity issues', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'))

      await expect(client.testConnection()).resolves.toBe(false)
    })

    it('should handle malformed JSON responses', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      })

      await expect(client.listModels()).rejects.toThrow('Unexpected token')
    })

    it('should handle timeout scenarios', async () => {
      jest.useFakeTimers()

      ;(fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] })
          }), 35000) // 35 second timeout
        })
      )

      const testPromise = client.testConnection()
      
      // Fast forward time
      jest.advanceTimersByTime(35000)
      
      await expect(testPromise).resolves.toBe(true)

      jest.useRealTimers()
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should handle complete spec generation workflow', async () => {
      // Mock the sequence of API calls in a typical workflow
      const mockResponses = [
        // 1. Requirements generation
        {
          choices: [{ message: { content: '# Requirements\n\n1. User authentication...' } }],
          usage: { total_tokens: 350 }
        },
        // 2. Design generation
        {
          choices: [{ message: { content: '# Design Specification\n\n## Architecture...' } }],
          usage: { total_tokens: 520 }
        },
        // 3. Tasks generation
        {
          choices: [{ message: { content: '# Implementation Tasks\n\n- [ ] Set up database...' } }],
          usage: { total_tokens: 420 }
        }
      ]

      let callCount = 0
      ;(fetch as jest.Mock).mockImplementation(() => {
        const response = mockResponses[callCount++] || mockResponses[0]
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response)
        })
      })

      // Simulate the three-phase generation
      const requirements = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'Generate requirements for auth system' }]
      })

      const design = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          { role: 'user', content: 'Generate requirements for auth system' },
          { role: 'assistant', content: requirements.choices[0].message.content },
          { role: 'user', content: 'Now generate the design specification' }
        ]
      })

      const tasks = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          { role: 'user', content: 'Generate requirements for auth system' },
          { role: 'assistant', content: requirements.choices[0].message.content },
          { role: 'user', content: 'Now generate the design specification' },
          { role: 'assistant', content: design.choices[0].message.content },
          { role: 'user', content: 'Now generate implementation tasks' }
        ]
      })

      expect(requirements.choices[0].message.content).toContain('Requirements')
      expect(design.choices[0].message.content).toContain('Design Specification')
      expect(tasks.choices[0].message.content).toContain('Implementation Tasks')
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should handle content refinement requests', async () => {
      const originalContent = '# Requirements\n\n1. Basic user authentication'
      const refinedContent = '# Enhanced Requirements\n\n1. Secure user authentication with MFA\n2. OAuth integration\n3. Session management'

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            choices: [{ message: { content: originalContent } }],
            usage: { total_tokens: 100 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            choices: [{ message: { content: refinedContent } }],
            usage: { total_tokens: 150 }
          })
        })

      // Initial generation
      const initial = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: 'Generate basic auth requirements' }]
      })

      // Refinement request
      const refined = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          { role: 'user', content: 'Generate basic auth requirements' },
          { role: 'assistant', content: initial.choices[0].message.content },
          { role: 'user', content: 'Please enhance these requirements with security best practices and OAuth integration' }
        ]
      })

      expect(initial.choices[0].message.content).toContain('Basic user authentication')
      expect(refined.choices[0].message.content).toContain('MFA')
      expect(refined.choices[0].message.content).toContain('OAuth')
    })

    it('should handle file context inclusion', async () => {
      const fileContext = 'interface User { id: string; email: string; role: Role; }'
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          choices: [{ message: { 
            content: '# Requirements\n\nBased on the provided TypeScript interface, the system should:\n\n1. Support user roles as defined in the Role type\n2. Use string IDs for users\n3. Require email addresses for authentication'
          } }],
          usage: { total_tokens: 280 }
        })
      })

      const response = await client.generateCompletion({
        model: 'anthropic/claude-3-sonnet',
        messages: [{
          role: 'user',
          content: `Generate requirements for a user management system based on this TypeScript interface:\n\n${fileContext}\n\nPlease create comprehensive requirements that align with this data structure.`
        }],
        max_tokens: 1500
      })

      expect(response.choices[0].message.content).toContain('user roles')
      expect(response.choices[0].message.content).toContain('string IDs')
      expect(response.choices[0].message.content).toContain('email addresses')
    })
  })
})