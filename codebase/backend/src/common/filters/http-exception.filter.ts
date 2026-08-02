import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as winston from 'winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: string | string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = typeof obj['message'] === 'string' ? obj['message'] : String(obj['message'] || message);
        if (Array.isArray(obj['message'])) {
          errorDetails = obj['message'] as string[];
        }
      } else {
        message = res as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error({
      message: `HTTP Error: ${status} - ${message}`,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      details: errorDetails,
    });
  }
}
