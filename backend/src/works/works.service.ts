import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';

const workSelect = {
  id: true,
  championshipId: true,
  nominationId: true,
  authorId: true,
  title: true,
  description: true,
  status: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  nomination: {
    select: { id: true, title: true },
  },
} as const;

@Injectable()
export class WorksService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChampionshipOrThrow(championshipId: number) {
    const ch = await this.prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true, registrationEndAt: true, status: true },
    });
    if (!ch) {
      throw new NotFoundException('Чемпионат не найден');
    }
    return ch;
  }

  private async assertParticipantMembership(
    actorId: number,
    championshipId: number,
    nominationId: number,
  ) {
    const membership = await this.prisma.championshipMembership.findFirst({
      where: {
        userId: actorId,
        championshipId,
        nominationId,
        role: { code: 'participant' },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new BadRequestException(
        'Нет назначения участника для выбранной номинации в этом чемпионате',
      );
    }
  }

  private assertBeforeDeadline(registrationEndAt: Date) {
    if (new Date() > registrationEndAt) {
      throw new BadRequestException('Срок подачи работ истек');
    }
  }

  async listMy(championshipId: number, actorId: number) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    await this.markOverdue(championshipId, ch.registrationEndAt);
    return this.prisma.work.findMany({
      where: { championshipId, authorId: actorId },
      orderBy: { id: 'asc' },
      select: workSelect,
    });
  }

  async findMyOne(championshipId: number, workId: number, actorId: number) {
    const row = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: workSelect,
    });
    if (!row) {
      throw new NotFoundException('Работа не найдена');
    }
    return row;
  }

  async create(championshipId: number, actorId: number, dto: CreateWorkDto) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);

    const nomination = await this.prisma.nomination.findFirst({
      where: { id: dto.nominationId, championshipId },
      select: { id: true },
    });
    if (!nomination) {
      throw new NotFoundException(
        'Номинация не найдена или относится к другому чемпионату',
      );
    }
    await this.assertParticipantMembership(
      actorId,
      championshipId,
      dto.nominationId,
    );

    try {
      return await this.prisma.work.create({
        data: {
          championshipId,
          nominationId: dto.nominationId,
          authorId: actorId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          status: WorkStatus.DRAFT,
        },
        select: workSelect,
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Для этой номинации у вас уже есть работа',
        );
      }
      throw e;
    }
  }

  async update(
    championshipId: number,
    workId: number,
    actorId: number,
    dto: UpdateWorkDto,
  ) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);
    const existing = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Работа не найдена');
    }
    if (existing.status !== WorkStatus.DRAFT) {
      throw new BadRequestException(
        'Редактирование доступно только для черновика',
      );
    }
    const data: Prisma.WorkUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (Object.keys(data).length === 0) {
      return this.findMyOne(championshipId, workId, actorId);
    }
    return this.prisma.work.update({
      where: { id: workId },
      data,
      select: workSelect,
    });
  }

  async submit(championshipId: number, workId: number, actorId: number) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);
    const existing = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Работа не найдена');
    }
    if (existing.status === WorkStatus.SUBMITTED) {
      return this.findMyOne(championshipId, workId, actorId);
    }
    if (existing.status !== WorkStatus.DRAFT) {
      throw new BadRequestException('Работа недоступна для отправки');
    }
    return this.prisma.work.update({
      where: { id: workId },
      data: {
        status: WorkStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      select: workSelect,
    });
  }

  async remove(championshipId: number, workId: number, actorId: number) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);
    const existing = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Работа не найдена');
    }
    if (existing.status !== WorkStatus.DRAFT) {
      throw new BadRequestException('Удаление доступно только для черновика');
    }
    await this.prisma.work.delete({ where: { id: workId } });
  }

  private async markOverdue(championshipId: number, registrationEndAt: Date) {
    if (new Date() <= registrationEndAt) {
      return;
    }
    await this.prisma.work.updateMany({
      where: { championshipId, status: WorkStatus.DRAFT },
      data: { status: WorkStatus.OVERDUE },
    });
  }
}
