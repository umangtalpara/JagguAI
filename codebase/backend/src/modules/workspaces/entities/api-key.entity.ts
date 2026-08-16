import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'api_keys' })
export class ApiKey {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, unique: true, index: true })
  keyHash!: string; // SHA-256 hash for O(1) database lookups

  @Prop({ required: true })
  keyMasked!: string; // e.g. jaggu_live_abc123...7890

  @Prop({ required: false })
  keyPlain?: string; // Full raw API key for direct embedding and copying

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export type ApiKeyDocument = ApiKey & Document;
export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
