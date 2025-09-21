import { OpenRouterClient } from '@/lib/openrouter/client'

// Mock fetch globally
global.fetch = jest.fn()

describe('Token Display Fix - Issue #17', () => {
  let client: OpenRouterClient
  const testApiKey = 'test-api-key-sk-or-v1-123'

  beforeEach(() => {
    client = new OpenRouterClient(testApiKey)
    ;(fetch as jest.Mock).mockReset()
  })

  it('should return usage information from parameter-based generateCompletion call', async () => {
    const mockApiResponse = {
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 1703123456,
      model: 'anthropic/claude-3-sonnet',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Test generated content for requirements'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 300,
        total_tokens: 450
      }
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse)
    })

    // Test parameter-based call (used by API route)
    const result = await client.generateCompletion(
      'anthropic/claude-3-sonnet',
      'You are a helpful assistant.',
      'Generate requirements for a user authentication system',
      [],
      { max_tokens: 2000 }
    )

    expect(result).toHaveProperty('content', 'Test generated content for requirements')
    expect(result).toHaveProperty('usage')
    expect(result.usage).toEqual({
      prompt_tokens: 150,
      completion_tokens: 300,
      total_tokens: 450
    })
    expect(result).toHaveProperty('model', 'anthropic/claude-3-sonnet')
  })

  it('should handle API response without usage data gracefully', async () => {
    const mockApiResponse = {
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 1703123456,
      model: 'anthropic/claude-3-sonnet',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Test content'
          },
          finish_reason: 'stop'
        }
      ]
      // Note: no usage field
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse)
    })

    const result = await client.generateCompletion(
      'anthropic/claude-3-sonnet',
      'System prompt',
      'User prompt'
    )

    expect(result).toHaveProperty('content', 'Test content')
    expect(result).toHaveProperty('usage', undefined)
    expect(result).toHaveProperty('model', 'anthropic/claude-3-sonnet')
  })
})