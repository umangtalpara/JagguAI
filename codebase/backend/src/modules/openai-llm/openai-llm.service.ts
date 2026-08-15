import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenaiLlmService {
  private readonly logger = new Logger(OpenaiLlmService.name);
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LLM_API_KEY');
    this.baseUrl = this.configService.get<string>('LLM_BASE_URL') || 'https://api.openai.com/v1';
    this.model = this.configService.get<string>('LLM_MODEL') || 'gpt-4o';
    this.logger.log(`LLM configured → model: ${this.model} | base: ${this.baseUrl}`);
  }

  async *streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      console.warn('LLM_API_KEY not configured. Running OpenaiLlmService in Mock mode.');
      const mockResponse = `This is a mock streaming response from JaguAI assistant. I am trained on your knowledge base to answer visitor queries. Since no LLM_API_KEY is configured in the environment, I am responding with this placeholder text. Please configure the LLM_API_KEY and LLM_BASE_URL in your backend .env file to enable Qwen 3 integration.`;
      
      const words = mockResponse.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      return;
    }

    try {
      const completionsUrl = this.baseUrl.endsWith('/chat/completions')
        ? this.baseUrl
        : `${this.baseUrl}/chat/completions`;
      this.logger.log(`→ POST ${completionsUrl} | model: ${this.model} | messages: ${messages.length}`);
      const t = Date.now();
      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'x-rotation-strategy': 'priority',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          // Disable Qwen3 chain-of-thought thinking mode — prevents reasoning
          // tokens from leaking into the streamed chat response
          enable_thinking: false,
          // Cap response length to keep answers concise for a chat widget
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`LLM API error ${response.status} ${response.statusText}: ${errText.slice(0, 200)}`);
        throw new Error(`LLM API returned ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`← LLM connection established (${Date.now() - t}ms) — streaming...`);
      let totalChunks = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder('utf8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) {
            continue;
          }
          if (cleanLine === 'data: [DONE]') {
            continue;
          }

          if (cleanLine.startsWith('data: ')) {
            try {
              const dataStr = cleanLine.substring(6);
              const data = JSON.parse(dataStr) as { choices?: { delta?: { content?: string; reasoning?: string } }[] };
              const delta = data.choices?.[0]?.delta;
              // Only yield actual content, skip reasoning/thinking chunks from models like DeepSeek
              const content = delta?.content;
              if (content) {
                totalChunks++;
                yield content;
              }
            } catch {
              // Ignore parse errors on partial streams
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown LLM error';
      this.logger.error(`LLM streaming error: ${msg}`);
      yield `[Error communicating with LLM: ${msg}]`;
    }
  }
}
