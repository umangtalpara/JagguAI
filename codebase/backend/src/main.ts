import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DatadogLoggerService } from './common/logger/datadog-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const datadogLogger = app.get(DatadogLoggerService);
  app.useLogger(datadogLogger);

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '', method: RequestMethod.ALL },
      { path: 'health', method: RequestMethod.ALL },
      { path: 'widget', method: RequestMethod.ALL },
      { path: 'widget/script.js', method: RequestMethod.ALL },
      { path: 'api/v1/widget', method: RequestMethod.ALL },
      { path: 'api/v1/widget/script.js', method: RequestMethod.ALL },
    ],
  });

  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false,
  }));

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
    exposedHeaders: ['X-Transcribed-Text', 'X-Response-Text', 'Set-Cookie'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalInterceptors(new LoggingInterceptor(datadogLogger));
  app.useGlobalFilters(new HttpExceptionFilter(datadogLogger));

  const config = new DocumentBuilder()
    .setTitle('jagguAI API')
    .setDescription('Deploy an AI Chat & Voice Assistant on any website in under 5 minutes.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = Number(process.env['PORT']) || 3001;
  await app.listen(port, '0.0.0.0');
  datadogLogger.log(`Application is running on: http://0.0.0.0:${port}/api/v1`, 'Bootstrap');
  datadogLogger.log(`Swagger documentation is available on: http://0.0.0.0:${port}/api/v1/docs`, 'Bootstrap');
  datadogLogger.log(`Health check available at: http://0.0.0.0:${port}/api/v1/health`, 'Bootstrap');
}

bootstrap();

