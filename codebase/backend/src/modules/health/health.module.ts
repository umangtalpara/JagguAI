import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
