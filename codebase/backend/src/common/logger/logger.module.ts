import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatadogLoggerService } from './datadog-logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatadogLoggerService],
  exports: [DatadogLoggerService],
})
export class LoggerModule {}
