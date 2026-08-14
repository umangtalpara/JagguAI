import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { Analytics, AnalyticsSchema } from './entities/analytics.entity';
import { Lead, LeadSchema } from './entities/lead.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';

import { VoiceSession, VoiceSessionSchema } from '../voice/entities/voice-session.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: VoiceSession.name, schema: VoiceSessionSchema },
    ]),
    WorkspacesModule,
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
