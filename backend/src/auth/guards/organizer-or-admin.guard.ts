import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../types/jwt-access.payload';

@Injectable()
export class OrganizerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtAccessPayload }>();
    const role = req.user?.appRole;
    if (role !== 'ADMIN' && role !== 'ORGANIZER') {
      throw new ForbiddenException(
        'Нужны права организатора или администратора',
      );
    }
    return true;
  }
}
