import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AppUserRole } from '../common/app-user-role';
import { PrismaService } from '../prisma/prisma.service';

const userPublicSelect = {
  id: true,
  login: true,
  firstname: true,
  surname: true,
  phone: true,
  tg: true,
  appRole: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: userPublicSelect,
      orderBy: { id: 'asc' },
    });
  }

  async setUserAppRole(
    actorId: number,
    targetUserId: number,
    appRole: AppUserRole,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, appRole: true },
    });
    if (!target) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (
      actorId === targetUserId &&
      target.appRole === 'ADMIN' &&
      appRole !== 'ADMIN'
    ) {
      const admins = await this.prisma.user.count({
        where: { appRole: 'ADMIN' },
      });
      if (admins <= 1) {
        throw new BadRequestException(
          'Нельзя снять с себя права администратора, пока вы единственный админ',
        );
      }
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { appRole },
      select: userPublicSelect,
    });
  }
}
