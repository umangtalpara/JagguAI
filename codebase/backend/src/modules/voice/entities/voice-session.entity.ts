import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'voice_sessions' })
export class VoiceSession {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, index: true })
  visitorId!: string;

  @Prop({ default: 0 })
  durationSeconds!: number;
}

export type VoiceSessionDocument = VoiceSession & Document;
export const VoiceSessionSchema = SchemaFactory.createForClass(VoiceSession);
