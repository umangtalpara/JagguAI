import { Controller, Get, Head, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './modules/health/health.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

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
      health: '/health',
    });
  }

  @Get(['health', 'api/v1/health'])
  @Head(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'Comprehensive health check with 12h Redis cache (checks external services 2x daily)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Bypass 12h cache and force immediate full check' })
  async health(
    @Query('force') force: string | boolean | undefined,
    @Res() res: Response,
  ) {
    const isForce = force === 'true' || force === true || force === '1';
    const report = await this.healthService.getHealth(isForce);
    const httpStatus = report['status'] === 'ok' ? 200 : 200; // Returns 200 with status field for uptime monitors
    return res.status(httpStatus).json(report);
  }

  @Get('widget/script.js')
  @ApiOperation({ summary: 'Root widget script alias' })
  rootWidgetScript(@Res() res: Response) {
    res.sendFile(require('path').join(__dirname, 'static', 'widget.js'));
  }

  @Get('widget')
  @ApiOperation({ summary: 'Root widget HTML alias' })
  rootWidgetHtml(@Res() res: Response) {
    res.sendFile(require('path').join(__dirname, 'static', 'widget.html'));
  }
}
