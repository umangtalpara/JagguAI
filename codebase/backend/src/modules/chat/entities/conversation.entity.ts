import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, index: true })
  visitorId!: string;
}

export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
