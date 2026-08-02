import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, trim: true })
  email!: string;

  @Prop({ default: '', trim: true })
  name!: string;

  @Prop({ required: true, index: true })
  visitorId!: string;
}

export type LeadDocument = Lead & Document;
export const LeadSchema = SchemaFactory.createForClass(Lead);
