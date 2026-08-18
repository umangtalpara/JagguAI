import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as os from 'os';

@Injectable()
export class DatadogLoggerService implements LoggerService {
  private readonly winstonLogger: winston.Logger;
  private readonly isDatadogEnabled: boolean;
  private readonly serviceName: string;
  private readonly envName: string;
  private readonly version: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    const ddApiKey = this.configService?.get<string>('DD_API_KEY') || process.env['DD_API_KEY'];
    const ddSite = this.configService?.get<string>('DD_SITE') || process.env['DD_SITE'] || 'us5.datadoghq.com';
    this.serviceName = this.configService?.get<string>('DD_SERVICE') || process.env['DD_SERVICE'] || 'jagguAi-backend';
    this.envName = this.configService?.get<string>('DD_ENV') || process.env['DD_ENV'] || 'development';
    this.version = this.configService?.get<string>('DD_VERSION') || process.env['DD_VERSION'] || '1.0.0';
    
    const logsEnabledRaw = this.configService?.get<string | boolean>('DD_LOGS_ENABLED') ?? process.env['DD_LOGS_ENABLED'];
    this.isDatadogEnabled = Boolean(ddApiKey) && (logsEnabledRaw === true || logsEnabledRaw === 'true' || logsEnabledRaw === '1');

    const transports: winston.transport[] = [];

    // Console transport for local/stdout logs
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}] ` : '';
        const metaEntries = Object.keys(meta).filter((k) => !['ddsource', 'service', 'ddtags', 'hostname'].includes(k));
        const metaStr = metaEntries.length ? ` ${JSON.stringify(meta)}` : '';
        return `[Nest] ${process.pid}  - ${timestamp}     ${level} ${ctx}${message}${metaStr}`;
      }),
    );

    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: this.envName === 'production' ? 'info' : 'debug',
      }),
    );

    // Datadog HTTP transport when enabled
    if (this.isDatadogEnabled && ddApiKey) {
      const datadogFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format((info) => {
          info['ddsource'] = 'nodejs';
          info['service'] = this.serviceName;
          info['ddtags'] = `env:${this.envName},version:${this.version}`;
          info['hostname'] = os.hostname();
          return info;
        })(),
        winston.format.json(),
      );

      const httpTransport = new winston.transports.Http({
        host: `http-intake.logs.${ddSite}`,
        path: `/api/v2/logs?dd-api-key=${ddApiKey}&ddsource=nodejs&service=${encodeURIComponent(this.serviceName)}&ddtags=${encodeURIComponent(`env:${this.envName},version:${this.version}`)}`,
        ssl: true,
        batch: true,
        batchInterval: 1000,
        batchCount: 20,
        format: datadogFormat,
        level: 'debug',
      });

      httpTransport.on('error', (err) => {
        // Prevent unhandled transport errors from crashing the app
        console.error('[DatadogLogger] Datadog log intake transport error:', err.message);
      });

      transports.push(httpTransport);
    }

    this.winstonLogger = winston.createLogger({
      transports,
      exitOnError: false,
    });

    if (this.isDatadogEnabled) {
      this.winstonLogger.info('Datadog Logger initialized successfully', {
        context: 'DatadogLoggerService',
        site: ddSite,
        service: this.serviceName,
        env: this.envName,
      });
    }
  }

  private parseLogArgs(message: unknown, optionalParams: unknown[]) {
    let context = '';
    let stack: string | undefined;
    let meta: Record<string, unknown> = {};

    let logMessage = '';
    if (message instanceof Error) {
      logMessage = message.message;
      stack = message.stack;
    } else if (typeof message === 'object' && message !== null) {
      const obj = message as Record<string, unknown>;
      logMessage = typeof obj['message'] === 'string' ? obj['message'] : JSON.stringify(message);
      meta = { ...obj };
      delete meta['message'];
    } else {
      logMessage = String(message ?? '');
    }

    for (const param of optionalParams) {
      if (typeof param === 'string') {
        if (!context && !param.includes('\n')) {
          context = param;
        } else if (!stack && (param.includes('\n') || param.startsWith('Error:'))) {
          stack = param;
        } else if (!context) {
          context = param;
        }
      } else if (typeof param === 'object' && param !== null) {
        meta = { ...meta, ...(param as Record<string, unknown>) };
      }
    }

    return { message: logMessage, context, stack, meta };
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.info(msg, { context, ...meta });
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, stack, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.error(msg, { context, stack, ...meta });
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.warn(msg, { context, ...meta });
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.debug(msg, { context, ...meta });
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.verbose(msg, { context, ...meta });
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    const { message: msg, context, stack, meta } = this.parseLogArgs(message, optionalParams);
    this.winstonLogger.error(msg, { context, stack, isFatal: true, ...meta });
  }
}
