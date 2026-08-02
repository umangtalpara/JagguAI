import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeFile, KnowledgeFileSchema } from './entities/knowledge-file.entity';
import { KnowledgeChunk, KnowledgeChunkSchema } from './entities/knowledge-chunk.entity';
import { DocumentProcessor } from './processors/document.processor';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { StorageModule } from '../storage/storage.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeFile.name, schema: KnowledgeFileSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    WorkspacesModule,
    StorageModule,
    EmbeddingsModule,
    QdrantModule,
    AuthModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository, DocumentProcessor],
  exports: [KnowledgeService, KnowledgeRepository],
})
export class KnowledgeModule {}
