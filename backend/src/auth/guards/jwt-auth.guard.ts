import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../types/jwt-access.payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7)
        : null;
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        { secret },
      );
      (req as Request & { user: JwtAccessPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
