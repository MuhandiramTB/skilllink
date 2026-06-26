import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from './guards/jwt-auth.guard';

/** Injects the authenticated { userId, role } attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    return req.user as RequestUser;
  },
);
