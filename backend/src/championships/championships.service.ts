import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChampionshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { ListChampionshipsQueryDto } from './dto/list-championships.query.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

const championshipSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  registrationStartAt: true,
  registrationEndAt: true,
  judgingStartAt: true,
  judgingEndAt: true,
  resultPublishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ChampionshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChampionshipDto) {
    this.assertDateConsistency(dto);
    return this.prisma.championship.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: (dto.status ?? 'DRAFT') as ChampionshipStatus,
        registrationStartAt: dto.registrationStartAt,
        registrationEndAt: dto.registrationEndAt,
        judgingStartAt: dto.judgingStartAt ?? null,
        judgingEndAt: dto.judgingEndAt ?? null,
        resultPublishedAt: dto.resultPublishedAt ?? null,
      },
      select: championshipSelect,
    });
  }

  list(query: ListChampionshipsQueryDto) {
    return this.prisma.championship.findMany({
      where: query.status ? { status: query.status as ChampionshipStatus } : {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: championshipSelect,
    });
  }

  async findOne(id: number) {
    const championship = await this.prisma.championship.findUnique({
      where: { id },
      select: championshipSelect,
    });
    if (!championship) {
      throw new NotFoundException('Чемпионат не найден');
    }
    return championship;
  }

  async update(id: number, dto: UpdateChampionshipDto) {
    const existing = await this.prisma.championship.findUnique({
      where: { id },
      select: championshipSelect,
    });
    if (!existing) {
      throw new NotFoundException('Чемпионат не найден');
    }
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Архивный чемпионат нельзя редактировать');
    }

    const next = {
      registrationStartAt:
        dto.registrationStartAt ?? existing.registrationStartAt,
      registrationEndAt: dto.registrationEndAt ?? existing.registrationEndAt,
      judgingStartAt:
        dto.judgingStartAt === undefined
          ? existing.judgingStartAt
          : dto.judgingStartAt,
      judgingEndAt:
        dto.judgingEndAt === undefined
          ? existing.judgingEndAt
          : dto.judgingEndAt,
      resultPublishedAt:
        dto.resultPublishedAt === undefined
          ? existing.resultPublishedAt
          : dto.resultPublishedAt,
    };
    this.assertDateConsistency(next);

    return this.prisma.championship.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        status: dto.status as ChampionshipStatus | undefined,
        registrationStartAt: dto.registrationStartAt,
        registrationEndAt: dto.registrationEndAt,
        judgingStartAt: dto.judgingStartAt,
        judgingEndAt: dto.judgingEndAt,
        resultPublishedAt: dto.resultPublishedAt,
      },
      select: championshipSelect,
    });
  }

  async archive(id: number) {
    const existing = await this.prisma.championship.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Чемпионат не найден');
    }
    if (existing.status === 'ARCHIVED') {
      return this.findOne(id);
    }
    if (existing.status === 'DRAFT') {
      throw new BadRequestException(
        'Черновик нельзя архивировать: переведите чемпионат в рабочий статус',
      );
    }

    return this.prisma.championship.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: championshipSelect,
    });
  }

  private assertDateConsistency(input: {
    registrationStartAt: Date;
    registrationEndAt: Date;
    judgingStartAt?: Date | null;
    judgingEndAt?: Date | null;
    resultPublishedAt?: Date | null;
  }) {
    const {
      registrationStartAt,
      registrationEndAt,
      judgingStartAt,
      judgingEndAt,
      resultPublishedAt,
    } = input;

    if (registrationStartAt >= registrationEndAt) {
      throw new BadRequestException(
        'Дата начала регистрации должна быть раньше даты окончания регистрации',
      );
    }
    if (judgingStartAt && judgingEndAt && judgingStartAt > judgingEndAt) {
      throw new BadRequestException(
        'Дата начала судейства должна быть не позже даты окончания судейства',
      );
    }
    if (resultPublishedAt && judgingEndAt && resultPublishedAt < judgingEndAt) {
      throw new BadRequestException(
        'Публикация результата не может быть раньше окончания судейства',
      );
    }
  }
}
