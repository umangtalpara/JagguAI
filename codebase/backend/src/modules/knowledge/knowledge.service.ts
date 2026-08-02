import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeRepository } from './knowledge.repository';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { StorageService } from '../storage/storage.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { KnowledgeFile, KnowledgeSourceType, KnowledgeProcessingStatus } from './entities/knowledge-file.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly storageService: StorageService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    @InjectQueue('document-processing') private readonly documentQueue: Queue,
  ) {}

  async uploadDocument(
    userId: string,
    workspaceId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<KnowledgeFile> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    let type = KnowledgeSourceType.TXT;
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.pdf')) {
      type = KnowledgeSourceType.PDF;
    } else if (name.endsWith('.docx')) {
      type = KnowledgeSourceType.DOCX;
    } else if (name.endsWith('.md')) {
      type = KnowledgeSourceType.MARKDOWN;
    }

    const { url, key } = await this.storageService.uploadFile(file);

    const fileDoc = await this.knowledgeRepository.insertFile({
      workspaceId,
      name: file.originalname,
      type,
      status: KnowledgeProcessingStatus.PENDING,
      s3Key: key,
      url,
    });

    const fileDocId = (fileDoc as unknown as Record<string, unknown>)['_id'];

    await this.documentQueue.add('process', {
      fileId: String(fileDocId || ''),
      workspaceId,
    });

    return fileDoc;
  }

  async addManualFaq(
    userId: string,
    workspaceId: string,
    question: string,
    answer: string,
  ): Promise<KnowledgeFile> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const faqName = `FAQ: ${question.substring(0, 30)}...`;
    
    const fileDoc = await this.knowledgeRepository.insertFile({
      workspaceId,
      name: faqName,
      type: KnowledgeSourceType.FAQ,
      status: KnowledgeProcessingStatus.COMPLETED,
      charCount: question.length + answer.length,
      chunkCount: 1,
    });

    const fileDocId = (fileDoc as unknown as Record<string, unknown>)['_id'];
    const chunkText = `Question: ${question}\nAnswer: ${answer}`;

    const vector = await this.embeddingsService.generateEmbedding(chunkText);
    const pointId = uuidv4();

    await this.qdrantService.indexChunk(workspaceId, pointId, vector, {
      workspaceId,
      fileId: String(fileDocId || ''),
      content: chunkText,
    });

    await this.knowledgeRepository.insertManyChunks([{
      workspaceId,
      fileId: String(fileDocId || ''),
      content: chunkText,
      qdrantPointId: pointId,
      metadata: { pageNumber: 1, heading: 'FAQ' },
    }]);

    return fileDoc;
  }

  async listDocuments(userId: string, workspaceId: string): Promise<KnowledgeFile[]> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);
    return this.knowledgeRepository.getFilesByWorkspace(workspaceId);
  }

  async deleteDocument(userId: string, workspaceId: string, fileId: string): Promise<void> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const fileDoc = await this.knowledgeRepository.getFileById(fileId);
    if (!fileDoc) {
      throw new NotFoundException('Document not found');
    }

    if (fileDoc.s3Key) {
      await this.storageService.deleteFile(fileDoc.s3Key);
    }

    await this.qdrantService.deleteFilePoints(workspaceId, fileId);
    await this.knowledgeRepository.deleteChunksByFile(fileId);
    await this.knowledgeRepository.deleteFileById(fileId);
  }
}
