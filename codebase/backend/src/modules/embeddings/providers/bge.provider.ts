import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../embedding.interface';

export class BgeEmbeddingProvider implements EmbeddingProvider {
  private readonly hfApiKey?: string;
  private readonly endpoint = 'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5';
  private readonly dimensions = 384;

  constructor(private readonly configService: ConfigService) {
    this.hfApiKey = this.configService.get<string>('HF_API_KEY');
  }

  getProviderName(): string {
    return 'bge';
  }

  getModelName(): string {
    return 'BAAI/bge-small-en-v1.5';
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async embedQuery(text: string): Promise<number[]> {
    const res = await this.embedDocuments([text]);
    return res[0] || Array.from({ length: this.dimensions }, () => Math.random());
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.hfApiKey) {
      return texts.map(() => Array.from({ length: this.dimensions }, () => Math.random()));
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
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
        let vector: number[] = [];

        if (Array.isArray(result) && Array.isArray(result[0])) {
          vector = result[0] as number[];
        } else if (Array.isArray(result)) {
          vector = result as number[];
        } else {
          throw new Error('Unexpected HuggingFace API response structure');
        }
        embeddings.push(vector);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to generate HuggingFace embedding: ${msg}. Falling back to mock vector.`);
        embeddings.push(Array.from({ length: this.dimensions }, () => Math.random()));
      }
    }
    return embeddings;
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    if (!this.hfApiKey) {
      return { status: 'error', message: 'HF_API_KEY environment variable is not configured' };
    }
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hfApiKey}`,
        },
        body: JSON.stringify({ inputs: ['healthcheck'] }),
      });
      if (response.ok) {
        return { status: 'ok' };
      }
      return { status: 'error', message: `Ping failed with HTTP ${response.status}` };
    } catch (e: any) {
      return { status: 'error', message: e.message || 'Connection failed' };
    }
  }
}
