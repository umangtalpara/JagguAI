import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { CrawlRequestDto } from './dto/crawl-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@ApiTags('crawler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RateLimitGuard)
@Controller('workspaces/:workspaceId/crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('crawl')
  @ApiOperation({ summary: 'Trigger a website crawl and index pages' })
  async crawl(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CrawlRequestDto,
  ): Promise<{ success: boolean; jobId: string }> {
    return this.crawlerService.triggerCrawl(req.user.id, workspaceId, dto.url, dto.maxPages);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Create a repeatable scheduled crawl cron job' })
  async schedule(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: { url: string; cron: string; maxPages?: number },
  ): Promise<{ success: boolean; jobId?: string }> {
    return this.crawlerService.scheduleCrawl(req.user.id, workspaceId, dto.url, dto.cron, dto.maxPages);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'List all repeatable scheduled crawl jobs' })
  async list(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<any[]> {
    return this.crawlerService.listSchedules(req.user.id, workspaceId);
  }

  @Delete('schedule')
  @ApiOperation({ summary: 'Revoke/delete a repeatable scheduled crawl job' })
  async remove(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Query('key') key: string,
  ): Promise<{ success: boolean }> {
    return this.crawlerService.removeSchedule(req.user.id, workspaceId, key);
  }
}
