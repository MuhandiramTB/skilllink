import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService, Role } from '../token.service';

export interface RequestUser {
  userId: string;
  roles: Role[]; // every role this account holds
  mode: Role; // the role the dashboard is currently acting as
}

/**
 * Verifies our jose-signed access JWT and attaches { userId, role } to the request.
 * (Spec Req 6.1/6.2.) Simpler than passport-jwt since we sign with jose/HS256.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.auth.noToken' });
    }
    try {
      const claims = await this.tokens.verifyAccessToken(token);
      req.user = { userId: claims.sub, roles: claims.roles, mode: claims.mode };
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.auth.tokenInvalid' });
    }
  }
}
