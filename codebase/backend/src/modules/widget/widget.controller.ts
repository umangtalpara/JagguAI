import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { WidgetService } from './widget.service';
import { UpdateWidgetSettingsDto } from './dto/update-widget-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WidgetSettings } from './entities/widget-settings.entity';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('widget')
@Controller()
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('workspaces/:workspaceId/widget')
  @ApiOperation({ summary: 'Get widget settings' })
  async getSettings(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WidgetSettings> {
    return this.widgetService.getSettings(req.user.id, workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('workspaces/:workspaceId/widget')
  @ApiOperation({ summary: 'Update widget settings' })
  async updateSettings(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWidgetSettingsDto,
  ): Promise<WidgetSettings> {
    return this.widgetService.updateSettings(req.user.id, workspaceId, dto);
  }

  @Get('widget/config')
  @ApiOperation({ summary: 'Get widget settings by API Key' })
  async getPublicSettings(@Query('apiKey') apiKey: string): Promise<WidgetSettings> {
    return this.widgetService.getSettingsByApiKey(apiKey);
  }

  @Get('widget/script.js')
  @ApiOperation({ summary: 'Get javascript widget loader script' })
  async getScript(@Res() res: Response): Promise<void> {
    res.sendFile(join(__dirname, '..', '..', 'static', 'widget.js'));
  }
}
