import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from './embedding.interface';
import { BgeEmbeddingProvider } from './providers/bge.provider';
import { JinaEmbeddingProvider } from './providers/jina.provider';

@Injectable()
export class EmbeddingsService {
  private readonly provider: EmbeddingProvider;

  constructor(private readonly configService: ConfigService) {
    const providerName = this.configService.get<string>('EMBEDDING_PROVIDER') || 'bge';
    if (providerName.toLowerCase() === 'jina') {
      this.provider = new JinaEmbeddingProvider(this.configService);
    } else {
      this.provider = new BgeEmbeddingProvider(this.configService);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.embedQuery(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.provider.embedDocuments(texts);
  }

  getDimensions(): number {
    return this.provider.getDimensions();
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }

  getModelName(): string {
    return this.provider.getModelName();
  }

  getCollectionName(): string {
    const provider = this.getProviderName();
    const version = this.configService.get<string>('EMBEDDING_VERSION') || 'v1';
    return `knowledge_chunks_${provider}_${version}`;
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    return this.provider.healthCheck();
  }
}
