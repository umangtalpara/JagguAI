import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(QdrantService.name);
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
      this.logger.warn('QDRANT_URL not configured. Running Qdrant in Mock mode.');
      return;
    }

    const collectionName = this.getActiveCollectionName();
    const dimensions = this.embeddingsService.getDimensions();

    try {
      const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        this.logger.log(`Creating dynamic Qdrant collection: ${collectionName} with dimensions: ${dimensions}`);
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
          this.logger.warn(`Failed to create Qdrant collection: ${createRes.statusText}`);
        }
      } else if (response.ok) {
        // Validate vector size of existing collection to prevent configuration mismatch
        const body = await response.json() as any;
        const configSize = body.result?.config?.params?.vectors?.size;
        if (configSize !== undefined && configSize !== dimensions) {
          this.logger.warn(`Vector dimension mismatch! Active provider is configured with ${dimensions} dimensions, but Qdrant collection ${collectionName} has size ${configSize}.`);
        } else {
          this.logger.log(`Qdrant collection ${collectionName} verified with dimensions ${dimensions}`);
        }
      }

      // Ensure payload indexes exist for filter-based delete operations (required by Qdrant Cloud)
      await this.ensurePayloadIndexes(collectionName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to initialize Qdrant (cluster may be offline/sleeping): ${msg}`);
    }
  }

  private async ensurePayloadIndexes(collectionName: string): Promise<void> {
    const fields = [
      { field_name: 'fileId', field_schema: 'keyword' },
      { field_name: 'workspaceId', field_schema: 'keyword' },
    ];

    for (const field of fields) {
      try {
        const res = await fetch(`${this.qdrantUrl}/collections/${collectionName}/index`, {
          method: 'PUT',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(field),
        });
        if (res.ok || res.status === 400) {
          // 400 means index already exists which is fine
          this.logger.log(`Payload index ensured for field: ${field.field_name} in collection ${collectionName}`);
        } else {
          this.logger.warn(`Failed to ensure payload index for ${field.field_name}: ${res.statusText}`);
        }
      } catch (err) {
        this.logger.warn(`Could not create payload index for ${field.field_name}:`, err);
      }
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
    try {
      const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        this.logger.log(`Creating collection ${collectionName} with size ${dimensions}`);
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
          this.logger.warn(`Failed to create Qdrant collection ${collectionName}: ${createRes.statusText}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error creating Qdrant collection ${collectionName}: ${msg}`);
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
    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Qdrant indexChunk error: ${msg}`);
      throw err;
    }
  }

  async deleteFilePoints(workspaceId: string, fileId: string): Promise<void> {
    if (!this.qdrantUrl) {
      return;
    }

    const collectionName = this.getActiveCollectionName();
    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Qdrant deleteFilePoints error: ${msg}`);
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
    try {
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
        this.logger.warn(`Failed to search Qdrant collection ${collectionName}: ${response.statusText}`);
        return [];
      }

      const json = await response.json() as { result?: QdrantSearchResult[] };
      return json.result || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Qdrant searchSimilar error: ${msg}. Returning empty context.`);
      return [];
    }
  }
}
