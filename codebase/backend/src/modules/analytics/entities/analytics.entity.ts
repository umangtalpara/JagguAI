import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'analytics' })
export class Analytics {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, index: true })
  visitorId!: string;

  @Prop({ default: 0 })
  responseTimeMs!: number;

  @Prop({ default: false })
  isFailedAnswer!: boolean;

  @Prop({ default: '' })
  queryText!: string;
}

export type AnalyticsDocument = Analytics & Document;
export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
