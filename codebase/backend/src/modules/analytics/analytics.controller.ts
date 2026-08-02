import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Lead } from './entities/lead.entity';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('workspaces/:workspaceId/analytics')
  @ApiOperation({ summary: 'Get workspace analytics and leads list' })
  async getSummary(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<unknown> {
    return this.analyticsService.getDashboardSummary(req.user.id, workspaceId);
  }

  @Post('widget/workspaces/:workspaceId/leads')
  @ApiOperation({ summary: 'Capture visitor contact details' })
  async captureLead(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CaptureLeadDto,
  ): Promise<Lead> {
    return this.analyticsService.captureLead(workspaceId, dto.visitorId, dto.email, dto.name);
  }
}
