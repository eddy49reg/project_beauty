import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../types/jwt-access.payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAccessPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtAccessPayload }>();
    return req.user;
  },
);
