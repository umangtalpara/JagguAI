import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QdrantPayload {
  workspaceId: string;
  fileId: string;
  content: string;
  sourceUrl?: string;
  heading?: string;
}

export interface QdrantSearchResult {
  id: string;
  score: number;
  payload: QdrantPayload;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly qdrantUrl?: string;
  private readonly apiKey?: string;
  private readonly collectionName = 'knowledge_chunks';

  constructor(private readonly configService: ConfigService) {
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL');
    this.apiKey = this.configService.get<string>('QDRANT_API_KEY');
  }

  async onModuleInit(): Promise<void> {
    if (!this.qdrantUrl) {
      console.warn('QDRANT_URL not configured. Running Qdrant in Mock mode.');
      return;
    }

    try {
      const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        const createRes = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
          method: 'PUT',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vectors: {
              size: 384,
              distance: 'Cosine',
            },
          }),
        });

        if (!createRes.ok) {
          throw new Error(`Failed to create Qdrant collection: ${createRes.statusText}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to initialize Qdrant: ${msg}`);
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    return headers;
  }

  async indexChunk(
    workspaceId: string,
    chunkId: string,
    vector: number[],
    payload: QdrantPayload,
  ): Promise<void> {
    if (!this.qdrantUrl) {
      return;
    }

    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points?wait=true`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points: [
          {
            id: chunkId,
            vector,
            payload,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to index chunk in Qdrant: ${response.statusText}`);
    }
  }

  async deleteFilePoints(workspaceId: string, fileId: string): Promise<void> {
    if (!this.qdrantUrl) {
      return;
    }

    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points/delete`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: 'fileId',
              match: { value: fileId },
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file points in Qdrant: ${response.statusText}`);
    }
  }

  async searchSimilar(
    workspaceId: string,
    vector: number[],
    limit = 5,
  ): Promise<QdrantSearchResult[]> {
    if (!this.qdrantUrl) {
      return [];
    }

    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points/search`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        limit,
        filter: {
          must: [
            {
              key: 'workspaceId',
              match: { value: workspaceId },
            },
          ],
        },
        with_payload: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search Qdrant: ${response.statusText}`);
    }

    const json = await response.json() as { result?: QdrantSearchResult[] };
    return json.result || [];
  }
}
