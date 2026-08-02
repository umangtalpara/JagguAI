import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ _id: false })
export class ChunkMetadata {
  @Prop({ default: 1 })
  pageNumber?: number;

  @Prop({ default: '' })
  heading?: string;

  @Prop({ default: '' })
  sourceUrl?: string;
}

@Schema({ timestamps: true, collection: 'knowledge_chunks' })
export class KnowledgeChunk {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'KnowledgeFile', required: true, index: true })
  fileId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: ChunkMetadata, default: () => ({}) })
  metadata!: ChunkMetadata;

  @Prop({ required: true })
  qdrantPointId!: string;
}

export type KnowledgeChunkDocument = KnowledgeChunk & Document;
export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);
