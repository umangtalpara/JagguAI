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
import { AuditLogsService } from '../audit-logs/audit-logs.service';


@Injectable()
export class KnowledgeService {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly storageService: StorageService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly auditLogsService: AuditLogsService,
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

    const fileDocId = String((fileDoc as any)._id || '');

    await this.documentQueue.add('process', {
      fileId: fileDocId,
      workspaceId,
    });

    await this.auditLogsService.log(userId, workspaceId, 'DOCUMENT_UPLOADED', { fileId: fileDocId, fileName: file.originalname });

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

    const fileDocId = String((fileDoc as any)._id || '');
    const chunkText = `Question: ${question}\nAnswer: ${answer}`;

    const vector = await this.embeddingsService.generateEmbedding(chunkText);
    const pointId = uuidv4();

    await this.qdrantService.indexChunk(workspaceId, pointId, vector, {
      workspaceId,
      fileId: fileDocId,
      content: chunkText,
    });

    await this.knowledgeRepository.insertManyChunks([{
      workspaceId,
      fileId: fileDocId,
      content: chunkText,
      qdrantPointId: pointId,
      metadata: { pageNumber: 1, heading: 'FAQ' },
    }]);

    await this.auditLogsService.log(userId, workspaceId, 'FAQ_CREATED', { faqId: fileDocId, question });

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

    await this.auditLogsService.log(userId, workspaceId, 'DOCUMENT_DELETED', { fileId, fileName: fileDoc.name });
  }

  async updateDocument(
    userId: string,
    workspaceId: string,
    fileId: string,
    dto: import('./dto/update-knowledge.dto').UpdateKnowledgeDto,
  ): Promise<KnowledgeFile> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const fileDoc = await this.knowledgeRepository.getFileById(fileId);
    if (!fileDoc) {
      throw new NotFoundException('Document not found');
    }

    if (fileDoc.type === KnowledgeSourceType.FAQ && (dto.question || dto.answer)) {
      // Deleting old vectors & chunks
      await this.qdrantService.deleteFilePoints(workspaceId, fileId);
      await this.knowledgeRepository.deleteChunksByFile(fileId);

      // Re-create FAQ chunk/vector
      const question = dto.question || fileDoc.name.replace(/^FAQ:\s+/, '').replace(/\.\.\.$/, '');
      const answer = dto.answer || '';
      
      const faqName = dto.name || `FAQ: ${question.substring(0, 30)}...`;
      const chunkText = `Question: ${question}\nAnswer: ${answer}`;

      const vector = await this.embeddingsService.generateEmbedding(chunkText);
      const pointId = uuidv4();

      await this.qdrantService.indexChunk(workspaceId, pointId, vector, {
        workspaceId,
        fileId,
        content: chunkText,
      });

      await this.knowledgeRepository.insertManyChunks([{
        workspaceId,
        fileId,
        content: chunkText,
        qdrantPointId: pointId,
        metadata: { pageNumber: 1, heading: 'FAQ' },
      }]);

      await this.knowledgeRepository.updateFileById(fileId, {
        name: faqName,
        charCount: question.length + answer.length,
      });
    } else if (dto.name) {
      await this.knowledgeRepository.updateFileById(fileId, { name: dto.name });
    }

    const updated = await this.knowledgeRepository.getFileById(fileId);
    if (!updated) {
      throw new NotFoundException('Document not found');
    }

    await this.auditLogsService.log(userId, workspaceId, 'DOCUMENT_UPDATED', { fileId, name: updated.name });
    return updated;
  }

  async reindexDocument(userId: string, workspaceId: string, fileId: string): Promise<{ success: boolean }> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const fileDoc = await this.knowledgeRepository.getFileById(fileId);
    if (!fileDoc) {
      throw new NotFoundException('Document not found');
    }

    await this.qdrantService.deleteFilePoints(workspaceId, fileId);
    await this.knowledgeRepository.deleteChunksByFile(fileId);

    await this.knowledgeRepository.updateFileById(fileId, {
      status: KnowledgeProcessingStatus.PENDING,
    });

    await this.documentQueue.add('process', {
      fileId,
      workspaceId,
    });

    await this.auditLogsService.log(userId, workspaceId, 'DOCUMENT_REINDEXED', { fileId, fileName: fileDoc.name });

    return { success: true };
  }

  async searchSimilarity(userId: string, workspaceId: string, query: string, limit = 5): Promise<any[]> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const vector = await this.embeddingsService.generateEmbedding(query);
    return this.qdrantService.searchSimilar(workspaceId, vector, limit);
  }
}
