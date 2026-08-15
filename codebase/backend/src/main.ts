import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(helmet());

  app.enableCors({
    origin: process.env['CORS_ALLOWED_ORIGINS']
      ? (process.env['CORS_ALLOWED_ORIGINS'] as string).split(',')
      : ['http://localhost:3000'],
    credentials: true,
    exposedHeaders: ['X-Transcribed-Text', 'X-Response-Text'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('jagguAI API')
    .setDescription('Deploy an AI Chat & Voice Assistant on any website in under 5 minutes.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env['PORT'] || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation is available on: http://localhost:${port}/api/v1/docs`);
}

// Wait! We can't do NestFactory.create(app) because app isn't defined yet! It should be AppModule.
// Let's write the correct code.
bootstrap();
