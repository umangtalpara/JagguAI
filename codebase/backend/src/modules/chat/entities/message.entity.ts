import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export enum MessageSender {
  VISITOR = 'visitor',
  ASSISTANT = 'assistant',
}

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId!: string;

  @Prop({ type: String, enum: MessageSender, required: true })
  sender!: MessageSender;

  @Prop({ required: true })
  content!: string;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);
