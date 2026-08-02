import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
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

@ApiTags('crawler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
}
