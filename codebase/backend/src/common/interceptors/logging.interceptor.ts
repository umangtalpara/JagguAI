import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { DatadogLoggerService } from '../logger/datadog-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: DatadogLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          this.logger.log(`HTTP ${method} ${originalUrl} ${statusCode} +${duration}ms`, {
            context: 'HTTP',
            http: {
              method,
              url: originalUrl,
              statusCode,
              durationMs: duration,
              clientIp: ip,
              userAgent,
            },
          });
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number') 
            ? err.status 
            : 500;
          const message = err instanceof Error ? err.message : String(err);

          this.logger.error(`HTTP ${method} ${originalUrl} ${statusCode} +${duration}ms - Error: ${message}`, {
            context: 'HTTP',
            http: {
              method,
              url: originalUrl,
              statusCode,
              durationMs: duration,
              clientIp: ip,
              userAgent,
              error: message,
            },
            stack: err instanceof Error ? err.stack : undefined,
          });
        },
      }),
    );
  }
}
