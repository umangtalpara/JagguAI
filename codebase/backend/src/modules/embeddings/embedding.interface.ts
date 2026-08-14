export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
  getProviderName(): string;
  getModelName(): string;
  getDimensions(): number;
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}
