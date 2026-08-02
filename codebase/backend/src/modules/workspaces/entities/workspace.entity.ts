import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ _id: false })
export class BrandingSettings {
  @Prop({ default: '' })
  logoUrl!: string;

  @Prop({ default: '#2563eb' })
  primaryColor!: string;

  @Prop({ default: 'light' })
  theme!: string;
}

@Schema({ timestamps: true, collection: 'workspaces' })
export class Workspace {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: string;

  @Prop({ default: '' })
  companyInfo!: string;

  @Prop({ type: BrandingSettings, default: () => ({}) })
  branding!: BrandingSettings;
}

export type WorkspaceDocument = Workspace & Document;
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
