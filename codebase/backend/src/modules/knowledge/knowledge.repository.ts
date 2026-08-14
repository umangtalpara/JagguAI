import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeFile, KnowledgeFileDocument } from './entities/knowledge-file.entity';
import { KnowledgeChunk, KnowledgeChunkDocument } from './entities/knowledge-chunk.entity';

@Injectable()
export class KnowledgeRepository {
  constructor(
    @InjectModel(KnowledgeFile.name) private readonly fileModel: Model<KnowledgeFileDocument>,
    @InjectModel(KnowledgeChunk.name) private readonly chunkModel: Model<KnowledgeChunkDocument>,
  ) {}

  // KnowledgeFile Operations
  async insertFile(data: Partial<KnowledgeFile>): Promise<KnowledgeFileDocument> {
    const file = new this.fileModel(data);
    return file.save();
  }

  async getFileById(id: string): Promise<KnowledgeFileDocument | null> {
    return this.fileModel.findById(id).exec();
  }

  async getFileByUrl(workspaceId: string, url: string): Promise<KnowledgeFileDocument | null> {
    return this.fileModel.findOne({ workspaceId, url }).exec();
  }

  async getFilesByWorkspace(workspaceId: string): Promise<KnowledgeFileDocument[]> {
    return this.fileModel.find({ workspaceId }).sort({ createdAt: -1 }).exec();
  }

  async updateFileById(id: string, updateData: Partial<KnowledgeFile>): Promise<KnowledgeFileDocument | null> {
    return this.fileModel.findOneAndUpdate({ _id: id }, updateData, { new: true }).exec();
  }

  async deleteFileById(id: string): Promise<boolean> {
    const result = await this.fileModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  // KnowledgeChunk Operations
  async insertManyChunks(chunks: Partial<KnowledgeChunk>[]): Promise<KnowledgeChunkDocument[]> {
    const docs = await this.chunkModel.insertMany(chunks);
    return docs as KnowledgeChunkDocument[];
  }

  async getChunksByFile(fileId: string): Promise<KnowledgeChunkDocument[]> {
    return this.chunkModel.find({ fileId }).exec();
  }

  async deleteChunksByFile(fileId: string): Promise<boolean> {
    const result = await this.chunkModel.deleteMany({ fileId }).exec();
    return result.deletedCount > 0;
  }

  async deleteChunksByWorkspace(workspaceId: string): Promise<boolean> {
    const result = await this.chunkModel.deleteMany({ workspaceId }).exec();
    return result.deletedCount > 0;
  }
}
