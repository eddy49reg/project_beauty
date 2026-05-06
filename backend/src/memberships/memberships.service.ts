import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';

const membershipSelect = {
  id: true,
  userId: true,
  championshipId: true,
  roleId: true,
  nominationId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      login: true,
      firstname: true,
      surname: true,
    },
  },
  role: {
    select: { id: true, code: true, title: true },
  },
  nomination: {
    select: { id: true, title: true },
  },
} as const;

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChampionshipOrThrow(championshipId: number) {
    const ch = await this.prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true, status: true, title: true },
    });
    if (!ch) {
      throw new NotFoundException('Чемпионат не найден');
    }
    return ch;
  }

  private assertChampionshipMutable(status: string) {
    if (status === 'ARCHIVED') {
      throw new BadRequestException(
        'Нельзя менять назначения архивного чемпионата',
      );
    }
  }

  async listForChampionship(championshipId: number) {
    await this.getChampionshipOrThrow(championshipId);
    return this.prisma.championshipMembership.findMany({
      where: { championshipId },
      orderBy: { id: 'asc' },
      select: membershipSelect,
    });
  }

  async create(championshipId: number, dto: CreateMembershipDto) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertChampionshipMutable(ch.status);

    const nomination = await this.prisma.nomination.findFirst({
      where: { id: dto.nominationId, championshipId },
      select: { id: true },
    });
    if (!nomination) {
      throw new NotFoundException(
        'Номинация не найдена или относится к другому чемпионату',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { id: true },
    });
    if (!role) {
      throw new NotFoundException('Роль не найдена');
    }

    try {
      return await this.prisma.championshipMembership.create({
        data: {
          championshipId,
          userId: dto.userId,
          roleId: dto.roleId,
          nominationId: dto.nominationId,
        },
        select: membershipSelect,
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Такое назначение уже есть (пользователь, номинация и роль в рамках чемпионата)',
        );
      }
      throw e;
    }
  }

  async remove(championshipId: number, membershipId: number) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertChampionshipMutable(ch.status);

    const row = await this.prisma.championshipMembership.findFirst({
      where: { id: membershipId, championshipId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Назначение не найдено');
    }

    await this.prisma.championshipMembership.delete({
      where: { id: membershipId },
    });
  }
}
