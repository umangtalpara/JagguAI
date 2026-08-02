import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WidgetSettings, WidgetSettingsDocument } from './entities/widget-settings.entity';

@Injectable()
export class WidgetRepository {
  constructor(
    @InjectModel(WidgetSettings.name)
    private readonly settingsModel: Model<WidgetSettingsDocument>,
  ) {}

  async getSettings(workspaceId: string): Promise<WidgetSettingsDocument | null> {
    return this.settingsModel.findOne({ workspaceId }).exec();
  }

  async insertSettings(data: Partial<WidgetSettings>): Promise<WidgetSettingsDocument> {
    const doc = new this.settingsModel(data);
    return doc.save();
  }

  async updateSettings(workspaceId: string, updateData: Partial<WidgetSettings>): Promise<WidgetSettingsDocument | null> {
    return this.settingsModel
      .findOneAndUpdate({ workspaceId }, updateData, { new: true, upsert: true })
      .exec();
  }
}
