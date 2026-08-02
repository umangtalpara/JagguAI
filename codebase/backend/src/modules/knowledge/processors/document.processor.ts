import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeRepository } from '../knowledge.repository';
import { StorageService } from '../../storage/storage.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import { KnowledgeProcessingStatus } from '../entities/knowledge-file.entity';
import { KnowledgeChunk } from '../entities/knowledge-chunk.entity';

interface JobData {
  fileId: string;
  workspaceId: string;
}

@Processor('document-processing')
@Injectable()
export class DocumentProcessor extends WorkerHost {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly storageService: StorageService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    const { fileId, workspaceId } = job.data;
    const fileDoc = await this.knowledgeRepository.getFileById(fileId);
    if (!fileDoc) {
      return;
    }

    await this.knowledgeRepository.updateFileById(fileId, {
      status: KnowledgeProcessingStatus.PROCESSING,
    });

    try {
      let text = '';
      if (fileDoc.type === 'faq') {
        return;
      }

      const buffer = await this.storageService.readFile(fileDoc.s3Key);

      if (fileDoc.type === 'txt' || fileDoc.type === 'markdown') {
        text = buffer.toString('utf8');
      } else if (fileDoc.type === 'pdf') {
        const parsed = await pdf(buffer);
        text = parsed.text;
      } else if (fileDoc.type === 'docx') {
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value;
      }

      if (!text || text.trim().length === 0) {
        throw new Error('Document contains no readable text');
      }

      const chunks: string[] = [];
      const chunkSize = 1000;
      const overlap = 200;
      let i = 0;
      while (i < text.length) {
        chunks.push(text.substring(i, i + chunkSize));
        i += chunkSize - overlap;
      }

      const chunkDocs: Partial<KnowledgeChunk>[] = [];
      let index = 0;
      for (const chunkText of chunks) {
        const cleanText = chunkText.trim();
        if (cleanText.length === 0) {
          continue;
        }

        const vector = await this.embeddingsService.generateEmbedding(cleanText);
        const pointId = uuidv4();

        await this.qdrantService.indexChunk(workspaceId, pointId, vector, {
          workspaceId,
          fileId,
          content: cleanText,
        });

        chunkDocs.push({
          workspaceId,
          fileId,
          content: cleanText,
          qdrantPointId: pointId,
          metadata: { pageNumber: 1, heading: `Section ${index + 1}` },
        });
        index++;
      }

      if (chunkDocs.length > 0) {
        await this.knowledgeRepository.insertManyChunks(chunkDocs);
      }

      await this.knowledgeRepository.updateFileById(fileId, {
        status: KnowledgeProcessingStatus.COMPLETED,
        charCount: text.length,
        chunkCount: chunkDocs.length,
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown processing error';
      await this.knowledgeRepository.updateFileById(fileId, {
        status: KnowledgeProcessingStatus.FAILED,
        error: msg,
      });
    }
  }
}
