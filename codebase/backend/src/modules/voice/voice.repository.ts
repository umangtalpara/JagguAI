import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VoiceSession, VoiceSessionDocument } from './entities/voice-session.entity';

@Injectable()
export class VoiceRepository {
  constructor(
    @InjectModel(VoiceSession.name)
    private readonly sessionModel: Model<VoiceSessionDocument>,
  ) {}

  async insertSession(data: Partial<VoiceSession>): Promise<VoiceSessionDocument> {
    const doc = new this.sessionModel(data);
    return doc.save();
  }

  async getSessionByVisitor(workspaceId: string, visitorId: string): Promise<VoiceSessionDocument | null> {
    return this.sessionModel.findOne({ workspaceId, visitorId }).exec();
  }

  async getSessionById(id: string): Promise<VoiceSessionDocument | null> {
    return this.sessionModel.findById(id).exec();
  }
}
