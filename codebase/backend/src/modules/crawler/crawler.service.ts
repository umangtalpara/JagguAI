import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CrawlerService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    @InjectQueue('web-crawling') private readonly crawlerQueue: Queue,
  ) {}

  async triggerCrawl(
    userId: string,
    workspaceId: string,
    seedUrl: string,
    maxPages?: number,
  ): Promise<{ success: boolean; jobId: string }> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const job = await this.crawlerQueue.add('crawl', {
      workspaceId,
      seedUrl,
      maxPages,
    });

    return {
      success: true,
      jobId: job.id || '',
    };
  }
}
