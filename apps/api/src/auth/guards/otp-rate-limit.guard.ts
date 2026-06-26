import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * OTP rate limit (Spec Req 1.3): max 5 requests / 15 min / phone.
 * In-memory sliding window — fine for v1 single-node. Swap for Redis when the API
 * scales horizontally (noted in steering/tech.md).
 */
@Injectable()
export class OtpRateLimitGuard implements CanActivate {
  private static readonly MAX = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const phone = (req.body?.phone as string) ?? 'unknown';
    const now = Date.now();
    const recent = (this.hits.get(phone) ?? []).filter(
      (t) => now - t < OtpRateLimitGuard.WINDOW_MS,
    );

    if (recent.length >= OtpRateLimitGuard.MAX) {
      throw new HttpException(
        { code: 'AUTH_RATE_LIMIT', message: 'errors.auth.rateLimit' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(phone, recent);
    return true;
  }
}
