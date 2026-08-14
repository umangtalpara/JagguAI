import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analytics, AnalyticsDocument } from './entities/analytics.entity';
import { Lead, LeadDocument } from './entities/lead.entity';

import { VoiceSession, VoiceSessionDocument } from '../voice/entities/voice-session.entity';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(Analytics.name) private readonly analyticsModel: Model<AnalyticsDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(VoiceSession.name) private readonly voiceSessionModel: Model<VoiceSessionDocument>,
  ) {}

  async getVoiceSessionsCount(workspaceId: string): Promise<number> {
    return this.voiceSessionModel.countDocuments({ workspaceId }).exec();
  }

  async insertMetric(data: Partial<Analytics>): Promise<AnalyticsDocument> {
    const doc = new this.analyticsModel(data);
    return doc.save();
  }

  async insertLead(data: Partial<Lead>): Promise<LeadDocument> {
    const doc = new this.leadModel(data);
    return doc.save();
  }

  async getLeads(workspaceId: string): Promise<LeadDocument[]> {
    return this.leadModel.find({ workspaceId }).sort({ createdAt: -1 }).exec();
  }

  async getMetrics(workspaceId: string): Promise<AnalyticsDocument[]> {
    return this.analyticsModel.find({ workspaceId }).sort({ createdAt: -1 }).exec();
  }

  async getFailedAnswers(workspaceId: string): Promise<AnalyticsDocument[]> {
    return this.analyticsModel.find({ workspaceId, isFailedAnswer: true }).sort({ createdAt: -1 }).exec();
  }
}
