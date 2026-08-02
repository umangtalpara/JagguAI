import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, collection: 'widget_settings' })
export class WidgetSettings {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Workspace', required: true, unique: true, index: true })
  workspaceId!: string;

  @Prop({ default: '#2563eb' })
  primaryColor!: string;

  @Prop({ default: '' })
  logoUrl!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ default: 'Hello! How can I help you today?' })
  greeting!: string;

  @Prop({ default: 'light' })
  theme!: string;

  @Prop({ default: 'bottom-right' })
  position!: string;

  @Prop({ default: true })
  voiceEnabled!: boolean;

  @Prop({ type: [String], default: [] })
  suggestedQuestions!: string[];
}

export type WidgetSettingsDocument = WidgetSettings & Document;
export const WidgetSettingsSchema = SchemaFactory.createForClass(WidgetSettings);
