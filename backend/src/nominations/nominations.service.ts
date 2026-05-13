import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AppUserRole } from '../common/app-user-role';
import { ChampionshipsService } from '../championships/championships.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';

const nominationSelect = {
  id: true,
  championshipId: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class NominationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly championships: ChampionshipsService,
  ) {}

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
        'Нельзя менять номинации архивного чемпионата',
      );
    }
  }

  async listForChampionship(championshipId: number) {
    await this.getChampionshipOrThrow(championshipId);
    return this.prisma.nomination.findMany({
      where: { championshipId },
      orderBy: { id: 'asc' },
      select: nominationSelect,
    });
  }

  async create(
    championshipId: number,
    dto: CreateNominationDto,
    actorId: number,
    appRole: AppUserRole,
  ) {
    await this.championships.assertUserCanManageChampionship(
      actorId,
      appRole,
      championshipId,
    );
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertChampionshipMutable(ch.status);
    try {
      return await this.prisma.nomination.create({
        data: {
          championshipId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
        },
        select: nominationSelect,
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Номинация с таким названием уже есть у этого чемпионата',
        );
      }
      throw e;
    }
  }

  async findOne(championshipId: number, nominationId: number) {
    await this.getChampionshipOrThrow(championshipId);
    const row = await this.prisma.nomination.findFirst({
      where: { id: nominationId, championshipId },
      select: nominationSelect,
    });
    if (!row) {
      throw new NotFoundException('Номинация не найдена');
    }
    return row;
  }

  async update(
    championshipId: number,
    nominationId: number,
    dto: UpdateNominationDto,
    actorId: number,
    appRole: AppUserRole,
  ) {
    await this.championships.assertUserCanManageChampionship(
      actorId,
      appRole,
      championshipId,
    );
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertChampionshipMutable(ch.status);
    const existing = await this.prisma.nomination.findFirst({
      where: { id: nominationId, championshipId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Номинация не найдена');
    }
    const data: Prisma.NominationUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (Object.keys(data).length === 0) {
      return this.findOne(championshipId, nominationId);
    }
    try {
      return await this.prisma.nomination.update({
        where: { id: nominationId },
        data,
        select: nominationSelect,
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Номинация с таким названием уже есть у этого чемпионата',
        );
      }
      throw e;
    }
  }

  async remove(
    championshipId: number,
    nominationId: number,
    actorId: number,
    appRole: AppUserRole,
  ) {
    await this.championships.assertUserCanManageChampionship(
      actorId,
      appRole,
      championshipId,
    );
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertChampionshipMutable(ch.status);
    const existing = await this.prisma.nomination.findFirst({
      where: { id: nominationId, championshipId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Номинация не найдена');
    }
    const links = await this.prisma.championshipMembership.count({
      where: { nominationId },
    });
    if (links > 0) {
      throw new BadRequestException(
        'Нельзя удалить номинацию: есть назначения участников (membership)',
      );
    }
    await this.prisma.nomination.delete({ where: { id: nominationId } });
  }
}
