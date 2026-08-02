import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Lead } from './entities/lead.entity';
import { Analytics } from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async logMetric(
    workspaceId: string,
    visitorId: string,
    queryText: string,
    responseTimeMs: number,
    isFailedAnswer: boolean,
  ): Promise<Analytics> {
    return this.analyticsRepository.insertMetric({
      workspaceId,
      visitorId,
      queryText,
      responseTimeMs,
      isFailedAnswer,
    });
  }

  async captureLead(
    workspaceId: string,
    visitorId: string,
    email: string,
    name?: string,
  ): Promise<Lead> {
    return this.analyticsRepository.insertLead({
      workspaceId,
      visitorId,
      email,
      name: name || '',
    });
  }

  async getDashboardSummary(userId: string, workspaceId: string): Promise<{
    totalChats: number;
    totalVisitors: number;
    avgResponseTimeMs: number;
    leads: unknown[];
    failedAnswers: unknown[];
  }> {
    await this.workspacesService.getWorkspaceDetails(userId, workspaceId);

    const metrics = await this.analyticsRepository.getMetrics(workspaceId);
    const leads = await this.analyticsRepository.getLeads(workspaceId);
    const failedAnswers = await this.analyticsRepository.getFailedAnswers(workspaceId);

    const visitors = new Set(metrics.map(m => m.visitorId));

    const totalTime = metrics.reduce((sum, m) => sum + m.responseTimeMs, 0);
    const avgResponseTimeMs = metrics.length > 0 ? Math.round(totalTime / metrics.length) : 0;

    return {
      totalChats: metrics.length,
      totalVisitors: visitors.size,
      avgResponseTimeMs,
      leads: leads.map(l => {
        const lId = (l as unknown as Record<string, unknown>)['_id'];
        const lCreatedAt = (l as unknown as Record<string, unknown>)['createdAt'];
        return {
          id: String(lId || ''),
          email: l.email,
          name: l.name,
          visitorId: l.visitorId,
          createdAt: lCreatedAt instanceof Date ? lCreatedAt : new Date(),
        };
      }),
      failedAnswers: failedAnswers.map(f => {
        const fId = (f as unknown as Record<string, unknown>)['_id'];
        const fCreatedAt = (f as unknown as Record<string, unknown>)['createdAt'];
        return {
          id: String(fId || ''),
          visitorId: f.visitorId,
          queryText: f.queryText,
          responseTimeMs: f.responseTimeMs,
          createdAt: fCreatedAt instanceof Date ? fCreatedAt : new Date(),
        };
      }),
    };
  }
}
