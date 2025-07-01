import apiClient from './apiClient';

interface AICompletionRequest {
  provider: 'openai' | 'anthropic' | 'datakit';
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface AICompletionResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalCredits: number;
  };
}

class AIService {
  async createCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    // If using DataKit AI, route through special endpoint
    if (request.provider === 'datakit') {
      return apiClient.post<AICompletionResponse>('/ai/datakit', {
        ...request,
        // DataKit AI uses its own internal provider selection
        provider: undefined,
      });
    }

    // For user's own API keys
    return apiClient.post<AICompletionResponse>('/ai/completion', request);
  }

  async createStreamingCompletion(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const endpoint = request.provider === 'datakit' ? '/ai/datakit/stream' : '/ai/completion/stream';
    
    try {
      const { accessToken } = await import('@/store/authStore').then(m => m.useAuthStore.getState());
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            ...request,
            stream: true,
            // DataKit AI doesn't need provider field
            ...(request.provider === 'datakit' ? { provider: undefined } : {}),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Stream failed'));
      throw error;
    }
  }

  async getAvailableModels(): Promise<{
    datakit: Array<{ id: string; name: string; description: string }>;
    openai: string[];
    anthropic: string[];
  }> {
    return apiClient.get('/ai/models');
  }

  async validateApiKey(provider: 'openai' | 'anthropic', apiKey: string): Promise<{
    valid: boolean;
    message?: string;
  }> {
    return apiClient.post('/ai/validate-key', { provider, apiKey });
  }
}

export const aiService = new AIService();
export default aiService;