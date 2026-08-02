import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export enum KnowledgeSourceType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  MARKDOWN = 'markdown',
  FAQ = 'faq',
  WEBSITE_CRAWL = 'website_crawl',
}

export enum KnowledgeProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true, collection: 'knowledge_files' })
export class KnowledgeFile {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: KnowledgeSourceType, required: true })
  type!: KnowledgeSourceType;

  @Prop({ type: String, enum: KnowledgeProcessingStatus, default: KnowledgeProcessingStatus.PENDING })
  status!: KnowledgeProcessingStatus;

  @Prop({ default: '' })
  s3Key!: string;

  @Prop({ default: '' })
  url!: string;

  @Prop({ default: 0 })
  charCount!: number;

  @Prop({ default: 0 })
  chunkCount!: number;

  @Prop({ default: '' })
  error!: string;
}

export type KnowledgeFileDocument = KnowledgeFile & Document;
export const KnowledgeFileSchema = SchemaFactory.createForClass(KnowledgeFile);
