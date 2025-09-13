import { OpenRouterClient } from '@/lib/openrouter/client'
import { OpenRouterError } from '@/lib/openrouter/errors'

// Mock fetch
global.fetch = jest.fn()

describe('OpenRouterClient', () => {
  const mockApiKey = 'test-api-key'
  let client: OpenRouterClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new OpenRouterClient(mockApiKey)
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Constructor', () => {
    it('should create client with API key', () => {
      expect(client).toBeInstanceOf(OpenRouterClient)
      expect(client['apiKey']).toBe(mockApiKey)
    })

    it('should throw error without API key', () => {
      expect(() => new OpenRouterClient('')).toThrow('API key is required')
    })
  })

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })

      const result = await client.testConnection()

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        }
      })
    })

    it('should handle connection failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const result = await client.testConnection()

      expect(result).toBe(false)
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await client.testConnection()

      expect(result).toBe(false)
    })
  })

  describe('listModels', () => {
    const mockModels = {
      data: [
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
        }
      ]
    }

    it('should fetch models successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels)
      })

      const models = await client.listModels()

      expect(models).toEqual(mockModels.data)
      expect(fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        }
      })
    })

    it('should handle API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
      })

      await expect(client.listModels()).rejects.toThrow(OpenRouterError)
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'))

      await expect(client.listModels()).rejects.toThrow('Network failed')
    })
  })

  describe('generateCompletion', () => {
    const mockRequest = {
      model: 'anthropic/claude-3-sonnet',
      messages: [{ role: 'user' as const, content: 'Hello world' }],
      max_tokens: 1000
    }

    const mockResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          }
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    }

    it('should generate completion successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const response = await client.generateCompletion(mockRequest)

      expect(response).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': expect.any(String),
          'X-Title': 'OpenSpec'
        },
        body: JSON.stringify(mockRequest)
      })
    })

    it('should handle rate limiting with retry', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () => Promise.resolve({ error: { message: 'Rate limited' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const response = await client.generateCompletion(mockRequest)

      expect(response).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ 
          error: { 
            message: 'Invalid model specified',
            code: 'invalid_model' 
          } 
        })
      })

      await expect(client.generateCompletion(mockRequest)).rejects.toThrow(OpenRouterError)
    })

    it('should validate request parameters', async () => {
      const invalidRequest = {
        model: '',
        messages: [],
        max_tokens: 0
      }

      await expect(client.generateCompletion(invalidRequest)).rejects.toThrow('Model is required')
    })

    it('should handle streaming responses', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\\n\\n'))
          controller.enqueue(new TextEncoder().encode('data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\\n\\n'))
          controller.enqueue(new TextEncoder().encode('data: [DONE]\\n\\n'))
          controller.close()
        }
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
        headers: new Map([['content-type', 'text/event-stream']])
      })

      const streamingRequest = { ...mockRequest, stream: true }
      const response = await client.generateCompletion(streamingRequest)

      expect(response).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      ;(fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      await expect(client.generateCompletion({
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }]
      })).rejects.toThrow('Request timeout')
    })

    it('should handle invalid JSON responses', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      await expect(client.listModels()).rejects.toThrow('Invalid JSON')
    })

    it('should handle missing response data', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      await expect(client.listModels()).rejects.toThrow()
    })
  })

  describe('Retry Logic', () => {
    it('should retry on 500 errors', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })

      const models = await client.listModels()

      expect(models).toEqual([])
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 400 errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Bad request' } })
      })

      await expect(client.listModels()).rejects.toThrow(OpenRouterError)
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should respect maximum retry attempts', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      await expect(client.listModels()).rejects.toThrow(OpenRouterError)
      expect(fetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })
  })

  describe('Request Configuration', () => {
    it('should set correct headers for all requests', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })

      await client.listModels()

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        })
      })
    })

    it('should include referer and title for completion requests', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'test' } }]
        })
      })

      await client.generateCompletion({
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }]
      })

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.objectContaining({
          'HTTP-Referer': expect.any(String),
          'X-Title': 'OpenSpec'
        }),
        body: expect.any(String)
      })
    })
  })
})