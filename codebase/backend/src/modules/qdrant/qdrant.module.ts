import { Module } from '@nestjs/common';
import { QdrantService } from './qdrant.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class QdrantModule {}
