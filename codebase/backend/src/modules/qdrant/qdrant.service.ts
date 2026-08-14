import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from '../embeddings/embeddings.service';

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

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL');
    this.apiKey = this.configService.get<string>('QDRANT_API_KEY');
  }

  async onModuleInit(): Promise<void> {
    if (!this.qdrantUrl) {
      console.warn('QDRANT_URL not configured. Running Qdrant in Mock mode.');
      return;
    }

    const collectionName = this.getActiveCollectionName();
    const dimensions = this.embeddingsService.getDimensions();

    try {
      const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        console.log(`Creating dynamic Qdrant collection: ${collectionName} with dimensions: ${dimensions}`);
        const createRes = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
          method: 'PUT',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vectors: {
              size: dimensions,
              distance: 'Cosine',
            },
          }),
        });

        if (!createRes.ok) {
          throw new Error(`Failed to create Qdrant collection: ${createRes.statusText}`);
        }
      } else if (response.ok) {
        // Validate vector size of existing collection to prevent configuration mismatch
        const body = await response.json() as any;
        const configSize = body.result?.config?.params?.vectors?.size;
        if (configSize !== undefined && configSize !== dimensions) {
          throw new Error(`Vector dimension mismatch! Active provider is configured with ${dimensions} dimensions, but Qdrant collection ${collectionName} has size ${configSize}. Please check your environment configuration or migrate to a new collection version.`);
        }
        console.log(`Qdrant collection ${collectionName} verified with dimensions ${dimensions}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to initialize Qdrant: ${msg}`);
      throw err;
    }
  }

  private getActiveCollectionName(): string {
    return this.embeddingsService.getCollectionName();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    return headers;
  }

  async createCollection(collectionName: string, dimensions: number): Promise<void> {
    if (!this.qdrantUrl) {
      return;
    }
    const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
      headers: this.getHeaders(),
    });

    if (response.status === 404) {
      console.log(`Creating collection ${collectionName} with size ${dimensions}`);
      const createRes = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vectors: {
            size: dimensions,
            distance: 'Cosine',
          },
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create Qdrant collection ${collectionName}: ${createRes.statusText}`);
      }
    }
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

    const collectionName = this.getActiveCollectionName();
    const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}/points?wait=true`, {
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
      throw new Error(`Failed to index chunk in Qdrant collection ${collectionName}: ${response.statusText}`);
    }
  }

  async deleteFilePoints(workspaceId: string, fileId: string): Promise<void> {
    if (!this.qdrantUrl) {
      return;
    }

    const collectionName = this.getActiveCollectionName();
    const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}/points/delete`, {
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
      throw new Error(`Failed to delete file points in Qdrant collection ${collectionName}: ${response.statusText}`);
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

    const collectionName = this.getActiveCollectionName();
    const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}/points/search`, {
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
      throw new Error(`Failed to search Qdrant collection ${collectionName}: ${response.statusText}`);
    }

    const json = await response.json() as { result?: QdrantSearchResult[] };
    return json.result || [];
  }
}
