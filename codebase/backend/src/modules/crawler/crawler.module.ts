import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import { CrawlerProcessor } from './processors/crawler.processor';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'web-crawling',
    }),
    WorkspacesModule,
    KnowledgeModule,
    EmbeddingsModule,
    QdrantModule,
    AuthModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerProcessor],
  exports: [CrawlerService],
})
export class CrawlerModule {}
