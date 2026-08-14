import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs = 60 * 1000; // 1 minute window
  private readonly maxRequests = 60; // 60 requests per window
  private readonly clients = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Fallback if IP address is not available
    const ip = request.ip || request.headers['x-forwarded-for'] || 'anonymous';
    const clientKey = request.user ? `user-${request.user.id}` : `ip-${ip}`;

    const now = Date.now();
    const timestamps = this.clients.get(clientKey) || [];

    // Filter out timestamps older than the window
    const recentTimestamps = timestamps.filter(time => now - time < this.windowMs);

    if (recentTimestamps.length >= this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again in a minute.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentTimestamps.push(now);
    this.clients.set(clientKey, recentTimestamps);

    return true;
  }
}
