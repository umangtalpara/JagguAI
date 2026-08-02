import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly hfApiKey?: string;
  private readonly endpoint = 'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-base-en-v1.5';

  constructor(private readonly configService: ConfigService) {
    this.hfApiKey = this.configService.get<string>('HF_API_KEY');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.hfApiKey) {
      return Array.from({ length: 768 }, () => Math.random());
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hfApiKey}`,
        },
        body: JSON.stringify({ inputs: [text] }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (Array.isArray(result) && Array.isArray(result[0])) {
        return result[0] as number[];
      } else if (Array.isArray(result)) {
        return result as number[];
      }
      throw new Error('Unexpected HuggingFace API response structure');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to generate HuggingFace embedding: ${msg}. Falling back to mock vector.`);
      return Array.from({ length: 768 }, () => Math.random());
    }
  }
}
