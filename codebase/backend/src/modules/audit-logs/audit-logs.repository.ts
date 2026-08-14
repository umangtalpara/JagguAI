import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<AuditLogDocument> {
    const doc = new this.auditLogModel(data);
    return doc.save();
  }

  async getLogsByWorkspace(workspaceId: string): Promise<AuditLogDocument[]> {
    return this.auditLogModel.find({ workspaceId }).sort({ createdAt: -1 }).exec();
  }
}
