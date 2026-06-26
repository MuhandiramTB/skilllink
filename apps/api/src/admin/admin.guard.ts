import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../auth/token.service';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

/**
 * Verifies the access token AND requires role=admin (Spec 06 Req 1).
 * Single guard for all /admin endpoints. Missing/invalid token → 401; non-admin → 403.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.auth.noToken' });
    }
    let claims;
    try {
      claims = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.auth.tokenInvalid' });
    }
    if (!claims.roles.includes('admin')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.auth.forbidden' });
    }
    req.user = { userId: claims.sub, roles: claims.roles, mode: claims.mode };
    return true;
  }
}
