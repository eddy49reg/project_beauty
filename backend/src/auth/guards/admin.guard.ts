import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../types/jwt-access.payload';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtAccessPayload }>();
    if (req.user?.appRole !== 'ADMIN') {
      throw new ForbiddenException('Нужны права администратора');
    }
    return true;
  }
}
