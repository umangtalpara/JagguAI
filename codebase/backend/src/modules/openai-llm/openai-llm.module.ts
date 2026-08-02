import { Module } from '@nestjs/common';
import { OpenaiLlmService } from './openai-llm.service';

@Module({
  providers: [OpenaiLlmService],
  exports: [OpenaiLlmService],
})
export class OpenaiLlmModule {}
