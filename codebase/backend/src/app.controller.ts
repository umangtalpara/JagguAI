import { Controller, Get, Head, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @Head()
  @ApiOperation({ summary: 'Root health check & API status' })
  root(@Res() res: Response) {
    return res.status(200).json({
      status: 'ok',
      service: 'jagguAI-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      docs: '/api/v1/docs',
      health: '/api/v1/health',
    });
  }

  @Get(['health', 'api/v1/health'])
  @Head(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'Health check endpoint' })
  health(@Res() res: Response) {
    return res.status(200).json({
      status: 'ok',
      service: 'jagguAI-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
    });
  }
}
