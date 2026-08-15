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
      const mockResponse = `This is a mock streaming response from jagguAI assistant. I am trained on your knowledge base to answer visitor queries. Since no LLM_API_KEY is configured in the environment, I am responding with this placeholder text. Please configure the LLM_API_KEY and LLM_BASE_URL in your backend .env file to enable Qwen 3 integration.`;

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
      const payload: Record<string, unknown> = {
        model: this.model,
        messages,
        stream: true,
        temperature: 0.2,
        max_tokens: 300,
        stop: [
          "$$",
          "\nUser:",
          "\nHuman:",
          "\nAssistant:"
        ],
      };

      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
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
      let isInsideThinkingBlock = false;

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
              const data = JSON.parse(dataStr) as {
                choices?: {
                  delta?: {
                    content?: string;
                    reasoning?: string;
                    reasoning_content?: string;
                  };
                }[];
              };
              const delta = data.choices?.[0]?.delta;

              // Ignore reasoning or reasoning_content fields
              if (delta?.reasoning || delta?.reasoning_content) {
                continue;
              }

              let content = delta?.content;
              if (content) {
                // If model outputs $ or $$ delimiter (Qwen3 thinking separator), cut off immediately without yielding the symbol
                if (content.includes('$')) {
                  const cleanPart = content.split('$')[0];
                  if (cleanPart && cleanPart.trim()) {
                    yield cleanPart;
                  }
                  return;
                }

                // Filter out <think>...</think> tags if model emits them in content
                if (content.includes('<think>')) {
                  isInsideThinkingBlock = true;
                  content = content.replace(/<think>[\s\S]*/, '');
                }
                if (isInsideThinkingBlock) {
                  if (content.includes('</think>')) {
                    isInsideThinkingBlock = false;
                    content = content.replace(/[\s\S]*<\/think>/, '');
                  } else {
                    continue;
                  }
                }

                if (content.trim()) {
                  totalChunks++;
                  yield content;
                }
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
