import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: false, index: true })
  workspaceId?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: false, index: true })
  userId?: string;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ type: SchemaTypes.Map, of: SchemaTypes.Mixed, default: {} })
  details!: Record<string, any>;
}

export type AuditLogDocument = AuditLog & Document;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
