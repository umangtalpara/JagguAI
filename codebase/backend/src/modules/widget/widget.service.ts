import { Injectable, NotFoundException } from '@nestjs/common';
import { WidgetRepository } from './widget.repository';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WidgetSettings } from './entities/widget-settings.entity';
import { UpdateWidgetSettingsDto } from './dto/update-widget-settings.dto';

@Injectable()
export class WidgetService {
  constructor(
    private readonly widgetRepository: WidgetRepository,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getSettings(userId: string, workspaceId: string): Promise<WidgetSettings> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);
    let settings = await this.widgetRepository.getSettings(workspaceId);
    if (!settings) {
      settings = await this.widgetRepository.insertSettings({
        workspaceId,
      });
    }
    return settings;
  }

  async updateSettings(
    userId: string,
    workspaceId: string,
    dto: UpdateWidgetSettingsDto,
  ): Promise<WidgetSettings> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);
    const updated = await this.widgetRepository.updateSettings(workspaceId, dto);
    if (!updated) {
      throw new NotFoundException('Failed to update settings');
    }
    return updated;
  }

  async getSettingsByApiKey(apiKey: string): Promise<WidgetSettings> {
    const workspace = await this.workspacesService.validateKey(apiKey);
    if (!workspace) {
      throw new NotFoundException('Invalid API Key');
    }
    const workspaceId = String((workspace as unknown as Record<string, unknown>)['_id'] || '');
    let settings = await this.widgetRepository.getSettings(workspaceId);
    if (!settings) {
      settings = await this.widgetRepository.insertSettings({
        workspaceId,
      });
    }
    return settings;
  }
}
