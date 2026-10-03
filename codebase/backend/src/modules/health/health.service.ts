import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { EmbeddingsService } from '../embeddings/embeddings.service';

export interface ServiceHealthResult {
  status: 'ok' | 'error' | 'disabled';
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface DeepCheckReport {
  timestamp: string;
  overallStatus: 'ok' | 'degraded';
  services: {
    database: ServiceHealthResult;
    redis: ServiceHealthResult;
    llm: ServiceHealthResult;
    embeddings: ServiceHealthResult;
    qdrant: ServiceHealthResult;
    deepgram: ServiceHealthResult;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redisClient?: Redis;
  private readonly CACHE_KEY = 'health:deep_check';
  private readonly CACHE_TTL_SECONDS = 43200; // 12 hours (runs twice a day)
  private inMemoryCache?: { data: DeepCheckReport; expiresAt: number };

  constructor(
    private readonly configService: ConfigService,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redisClient.on('error', (err) => {
        this.logger.warn(`Redis client health error: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Could not initialize Redis client for HealthService: ${e.message}`);
    }
  }

  async getHealth(force = false): Promise<Record<string, unknown>> {
    const now = Date.now();
    let cachedReport: DeepCheckReport | null = null;
    let ttlRemaining = 0;

    if (!force) {
      // 1. Try Redis cache
      if (this.redisClient) {
        try {
          if (this.redisClient.status !== 'ready' && this.redisClient.status !== 'connecting') {
            await this.redisClient.connect().catch(() => {});
          }
          const raw = await this.redisClient.get(this.CACHE_KEY);
          if (raw) {
            cachedReport = JSON.parse(raw);
            const ttl = await this.redisClient.ttl(this.CACHE_KEY);
            ttlRemaining = ttl > 0 ? ttl : this.CACHE_TTL_SECONDS;
          }
        } catch (err: any) {
          this.logger.warn(`Failed to read health cache from Redis: ${err.message}`);
        }
      }

      // 2. Try In-memory fallback cache if Redis was unavailable
      if (!cachedReport && this.inMemoryCache && this.inMemoryCache.expiresAt > now) {
        cachedReport = this.inMemoryCache.data;
        ttlRemaining = Math.round((this.inMemoryCache.expiresAt - now) / 1000);
      }
    }

    // If cache hit, return lightweight response with cached deep-check data
    if (cachedReport) {
      return {
        status: cachedReport.overallStatus,
        service: 'jagguAI-backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        },
        deepCheck: {
          cached: true,
          mode: '12-hour cached check (runs 2x daily)',
          lastCheckedAt: cachedReport.timestamp,
          nextCheckInSeconds: ttlRemaining,
          services: cachedReport.services,
        },
      };
    }

    // Otherwise, perform full deep check
    this.logger.log('Performing comprehensive 12-hour deep health check across all services...');
    const deepReport = await this.performDeepCheck();

    // Cache the deep check result in Redis
    if (this.redisClient) {
      try {
        if (this.redisClient.status !== 'ready' && this.redisClient.status !== 'connecting') {
          await this.redisClient.connect().catch(() => {});
        }
        await this.redisClient.set(
          this.CACHE_KEY,
          JSON.stringify(deepReport),
          'EX',
          this.CACHE_TTL_SECONDS,
        );
      } catch (err: any) {
        this.logger.warn(`Failed to write health cache to Redis: ${err.message}`);
      }
    }

    // Also update in-memory cache as backup
    this.inMemoryCache = {
      data: deepReport,
      expiresAt: now + this.CACHE_TTL_SECONDS * 1000,
    };

    return {
      status: deepReport.overallStatus,
      service: 'jagguAI-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
      deepCheck: {
        cached: false,
        mode: '12-hour cached check (runs 2x daily)',
        lastCheckedAt: deepReport.timestamp,
        nextCheckInSeconds: this.CACHE_TTL_SECONDS,
        services: deepReport.services,
      },
    };
  }

  private async performDeepCheck(): Promise<DeepCheckReport> {
    const [dbRes, redisRes, llmRes, embRes, qdrantRes, deepgramRes] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkLlm(),
      this.checkEmbeddings(),
      this.checkQdrant(),
      this.checkDeepgram(),
    ]);

    const database = dbRes.status === 'fulfilled' ? dbRes.value : { status: 'error', message: (dbRes as any).reason?.message };
    const redis = redisRes.status === 'fulfilled' ? redisRes.value : { status: 'error', message: (redisRes as any).reason?.message };
    const llm = llmRes.status === 'fulfilled' ? llmRes.value : { status: 'error', message: (llmRes as any).reason?.message };
    const embeddings = embRes.status === 'fulfilled' ? embRes.value : { status: 'error', message: (embRes as any).reason?.message };
    const qdrant = qdrantRes.status === 'fulfilled' ? qdrantRes.value : { status: 'error', message: (qdrantRes as any).reason?.message };
    const deepgram = deepgramRes.status === 'fulfilled' ? deepgramRes.value : { status: 'error', message: (deepgramRes as any).reason?.message };

    const services = {
      database: database as ServiceHealthResult,
      redis: redis as ServiceHealthResult,
      llm: llm as ServiceHealthResult,
      embeddings: embeddings as ServiceHealthResult,
      qdrant: qdrant as ServiceHealthResult,
      deepgram: deepgram as ServiceHealthResult,
    };

    const hasErrors = Object.values(services).some((s) => s.status === 'error');

    if (hasErrors) {
      const failedServices = Object.entries(services)
        .filter(([_, res]) => res.status === 'error')
        .map(([name, res]) => `${name}: ${res.message || 'unknown error'}`)
        .join(' | ');

      this.logger.error(`[Datadog] Health check degraded - issues found in: ${failedServices}`, {
        context: 'HealthCheck',
        overallStatus: 'degraded',
        failedCount: Object.values(services).filter((s) => s.status === 'error').length,
        services,
      });
    } else {
      this.logger.log(`[Datadog] 12-hour deep health check healthy for all upstream services`, {
        context: 'HealthCheck',
        overallStatus: 'ok',
        services,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      overallStatus: hasErrors ? 'degraded' : 'ok',
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealthResult> {
    const start = Date.now();
    try {
      if (this.mongoConnection.readyState !== 1) {
        return {
          status: 'error',
          message: `MongoDB connection state is ${this.mongoConnection.readyState} (not connected)`,
          latencyMs: Date.now() - start,
        };
      }
      if (this.mongoConnection.db) {
        await this.mongoConnection.db.admin().ping();
      }
      return {
        status: 'ok',
        latencyMs: Date.now() - start,
        details: { state: 'connected' },
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'Database ping failed',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealthResult> {
    const start = Date.now();
    try {
      if (!this.redisClient) {
        return { status: 'disabled', message: 'Redis not configured' };
      }
      if (this.redisClient.status !== 'ready' && this.redisClient.status !== 'connecting') {
        await this.redisClient.connect().catch(() => {});
      }
      const pingRes = await this.redisClient.ping();
      if (pingRes === 'PONG') {
        return {
          status: 'ok',
          latencyMs: Date.now() - start,
        };
      }
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: `Unexpected Redis response: ${pingRes}`,
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'Redis connection failed',
      };
    }
  }

  private async checkLlm(): Promise<ServiceHealthResult> {
    const start = Date.now();
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const baseUrl = this.configService.get<string>('LLM_BASE_URL') || 'https://api.openai.com/v1';
    const model = this.configService.get<string>('LLM_MODEL') || 'gpt-4o';

    if (!apiKey) {
      return {
        status: 'disabled',
        message: 'LLM_API_KEY not configured (running in mock mode)',
        details: { model, baseUrl },
      };
    }

    try {
      const completionsUrl = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl}/chat/completions`;

      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          status: 'error',
          latencyMs: Date.now() - start,
          message: `HTTP ${response.status}: ${text.slice(0, 150)}`,
          details: { model, baseUrl },
        };
      }

      return {
        status: 'ok',
        latencyMs: Date.now() - start,
        details: { model, baseUrl },
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'LLM API request failed',
        details: { model, baseUrl },
      };
    }
  }

  private async checkEmbeddings(): Promise<ServiceHealthResult> {
    const start = Date.now();
    const provider = this.embeddingsService.getProviderName();
    const model = this.embeddingsService.getModelName();
    try {
      const res = await this.embeddingsService.healthCheck();
      return {
        status: res.status === 'ok' ? 'ok' : 'error',
        latencyMs: Date.now() - start,
        message: res.message,
        details: { provider, model, dimensions: this.embeddingsService.getDimensions() },
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'Embeddings health check failed',
        details: { provider, model },
      };
    }
  }

  private async checkQdrant(): Promise<ServiceHealthResult> {
    const start = Date.now();
    const qdrantUrl = this.configService.get<string>('QDRANT_URL');
    const apiKey = this.configService.get<string>('QDRANT_API_KEY');

    if (!qdrantUrl) {
      return { status: 'disabled', message: 'QDRANT_URL not configured' };
    }

    try {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['api-key'] = apiKey;
      }

      const response = await fetch(`${qdrantUrl}/collections`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return {
          status: 'error',
          latencyMs: Date.now() - start,
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { qdrantUrl },
        };
      }

      const data = (await response.json()) as any;
      const collections = data.result?.collections?.map((c: any) => c.name) || [];

      return {
        status: 'ok',
        latencyMs: Date.now() - start,
        details: { qdrantUrl, collectionsCount: collections.length },
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'Qdrant connection failed (cluster may be paused or offline)',
        details: { qdrantUrl },
      };
    }
  }

  private async checkDeepgram(): Promise<ServiceHealthResult> {
    const start = Date.now();
    const apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');

    if (!apiKey) {
      return { status: 'disabled', message: 'DEEPGRAM_API_KEY not configured' };
    }

    try {
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          Authorization: `Token ${apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return {
          status: 'error',
          latencyMs: Date.now() - start,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        message: err.message || 'Deepgram API connection failed',
      };
    }
  }
}
