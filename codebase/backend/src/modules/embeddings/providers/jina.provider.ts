import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../embedding.interface';

export class JinaEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly dimensions: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('JINA_API_KEY');
    this.baseUrl = this.configService.get<string>('JINA_BASE_URL') || 'https://api.jina.ai/v1';
    this.modelName = this.configService.get<string>('EMBEDDING_MODEL') || 'jina-embeddings-v3';
    this.dimensions = parseInt(this.configService.get<string>('EMBEDDING_DIMENSIONS') || '768', 10);
  }

  getProviderName(): string {
    return 'jina';
  }

  getModelName(): string {
    return this.modelName;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async embedQuery(text: string): Promise<number[]> {
    const res = await this.embedDocuments([text]);
    return res[0] || Array.from({ length: this.dimensions }, () => Math.random());
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      console.warn('JINA_API_KEY is not configured. Running Jina in Mock mode.');
      return texts.map(() => Array.from({ length: this.dimensions }, () => Math.random()));
    }

    const batchSize = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.embedBatchWithRetry(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  private async embedBatchWithRetry(batch: string[], retries = 3, delay = 500): Promise<number[][]> {
    const url = this.baseUrl.endsWith('/embeddings') ? this.baseUrl : `${this.baseUrl}/embeddings`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          task: 'retrieval.passage',
          normalized: true,
          input: batch.map((text) => ({ text })),
        }),
      });

      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (retries > 0) {
          console.warn(`Jina API returned transient status ${response.status}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.embedBatchWithRetry(batch, retries - 1, delay * 2);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina Embeddings API request failed with status ${response.status}: ${errorText}`);
      }

      const body = await response.json() as any;
      if (!body?.data || !Array.isArray(body.data)) {
        throw new Error('Malformed Jina API response body structure');
      }

      const sortedData = [...body.data].sort((a: any, b: any) => a.index - b.index);
      return sortedData.map((item: any) => item.embedding as number[]);
    } catch (error: any) {
      if (retries > 0) {
        console.warn(`Jina API error encountered: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.embedBatchWithRetry(batch, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    if (!this.apiKey) {
      return { status: 'error', message: 'JINA_API_KEY environment variable is not configured' };
    }
    try {
      const url = this.baseUrl.endsWith('/embeddings') ? this.baseUrl : `${this.baseUrl}/embeddings`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          task: 'retrieval.passage',
          normalized: true,
          input: [{ text: 'healthcheck' }],
        }),
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
