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

  async scheduleCrawl(
    userId: string,
    workspaceId: string,
    seedUrl: string,
    cron: string,
    maxPages?: number,
  ): Promise<{ success: boolean; jobId?: string }> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const idSuffix = Buffer.from(seedUrl).toString('base64').substring(0, 15).replace(/[^a-zA-Z0-9]/g, '');
    const jobId = `repeat-${workspaceId}-${idSuffix}`;

    const job = await this.crawlerQueue.add(
      'crawl',
      { workspaceId, seedUrl, maxPages },
      {
        repeat: { pattern: cron },
        jobId,
      },
    );

    return { success: true, jobId: job.id };
  }

  async listSchedules(userId: string, workspaceId: string): Promise<any[]> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);
    const jobs = await this.crawlerQueue.getRepeatableJobs();
    return jobs.filter(j => j.id?.includes(`repeat-${workspaceId}`) || j.key?.includes(`repeat-${workspaceId}`));
  }

  async removeSchedule(userId: string, workspaceId: string, key: string): Promise<{ success: boolean }> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);
    await this.crawlerQueue.removeRepeatableByKey(key);
    return { success: true };
  }
}
