import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import * as Joi from 'joi';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { StorageModule } from './modules/storage/storage.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { QdrantModule } from './modules/qdrant/qdrant.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { OpenaiLlmModule } from './modules/openai-llm/openai-llm.module';
import { ChatModule } from './modules/chat/chat.module';
import { WidgetModule } from './modules/widget/widget.module';
import { VoiceModule } from './modules/voice/voice.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
        PORT: Joi.number().default(3001),
        MONGODB_URI: Joi.string().required(),
        REDIS_URL: Joi.string().optional(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        API_KEY_SECRET: Joi.string().min(32).required(),
        
        LLM_API_KEY: Joi.string().optional(),
        LLM_BASE_URL: Joi.string().optional(),
        LLM_MODEL: Joi.string().default('qwen-3'),
        QDRANT_URL: Joi.string().optional(),
        QDRANT_API_KEY: Joi.string().optional(),
        
        DEEPGRAM_API_KEY: Joi.string().optional(),
        KOKORO_BASE_URL: Joi.string().optional(),
        KOKORO_VOICE: Joi.string().optional(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    WorkspacesModule,
    StorageModule,
    EmbeddingsModule,
    QdrantModule,
    KnowledgeModule,
    CrawlerModule,
    OpenaiLlmModule,
    ChatModule,
    WidgetModule,
    VoiceModule,
    AnalyticsModule,
    AuditLogsModule,
  ],
})
export class AppModule {}


