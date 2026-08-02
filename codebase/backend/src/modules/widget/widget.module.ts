import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { WidgetRepository } from './widget.repository';
import { WidgetSettings, WidgetSettingsSchema } from './entities/widget-settings.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WidgetSettings.name, schema: WidgetSettingsSchema }]),
    WorkspacesModule,
    AuthModule,
  ],
  controllers: [WidgetController],
  providers: [WidgetService, WidgetRepository],
  exports: [WidgetService],
})
export class WidgetModule {}
