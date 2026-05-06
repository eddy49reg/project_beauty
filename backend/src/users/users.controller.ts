import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizerOrAdminGuard } from '../auth/guards/organizer-or-admin.guard';
import { PrismaService } from '../prisma/prisma.service';

const directorySelect = {
  id: true,
  login: true,
  firstname: true,
  surname: true,
} as const;

@Controller('users')
@UseGuards(JwtAuthGuard, OrganizerOrAdminGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /** Список пользователей для выбора при назначениях в чемпионате (организатор/админ). */
  @Get()
  directory() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: directorySelect,
    });
  }
}
