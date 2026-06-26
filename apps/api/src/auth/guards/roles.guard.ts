import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { RequestUser } from './jwt-auth.guard';
import type { Role } from '../token.service';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Enforces role MEMBERSHIP on an endpoint (Spec Req 6.3). Use with JwtAuthGuard,
 * which must run first to attach req.user. Passes if the account HOLDS any required
 * role — independent of the current dashboard mode, so a provider endpoint stays
 * reachable while the user is browsing in customer mode. Otherwise → 403 FORBIDDEN.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const held = req.user?.roles ?? [];
    if (!req.user || !required.some((r) => held.includes(r))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.auth.forbidden' });
    }
    return true;
  }
}
