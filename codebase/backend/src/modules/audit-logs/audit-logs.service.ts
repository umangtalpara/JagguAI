import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async log(
    userId: string | undefined,
    workspaceId: string | undefined,
    action: string,
    details: Record<string, any> = {},
  ): Promise<AuditLog> {
    return this.auditLogsRepository.log({
      userId,
      workspaceId,
      action,
      details,
    });
  }

  async getLogs(workspaceId: string): Promise<AuditLog[]> {
    return this.auditLogsRepository.getLogsByWorkspace(workspaceId);
  }
}
