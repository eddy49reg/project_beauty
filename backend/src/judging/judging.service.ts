import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChampionshipStatus, WorkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJudgeScoreDto } from './dto/upsert-judge-score.dto';

const judgeWorkSelect = {
  id: true,
  championshipId: true,
  nominationId: true,
  authorId: true,
  title: true,
  description: true,
  status: true,
  submittedAt: true,
  nomination: {
    select: { id: true, title: true },
  },
  author: {
    select: { id: true, login: true, firstname: true, surname: true },
  },
  attachments: {
    select: {
      id: true,
      viewUrl: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' as const },
  },
} as const;

@Injectable()
export class JudgingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChampionshipOrThrow(championshipId: number) {
    const ch = await this.prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true, status: true },
    });
    if (!ch) throw new NotFoundException('Чемпионат не найден');
    return ch;
  }

  private async assertJudgeAccess(
    judgeId: number,
    championshipId: number,
    nominationId: number,
  ) {
    const has = await this.prisma.championshipMembership.findFirst({
      where: {
        userId: judgeId,
        championshipId,
        nominationId,
        role: { code: 'judge' },
      },
      select: { id: true },
    });
    if (!has) {
      throw new ForbiddenException(
        'Нет доступа судьи к этой номинации чемпионата',
      );
    }
  }

  async listJudgeWorks(championshipId: number, judgeId: number) {
    await this.getChampionshipOrThrow(championshipId);
    const works = await this.prisma.work.findMany({
      where: {
        championshipId,
        status: WorkStatus.SUBMITTED,
        nomination: {
          membership: {
            some: {
              userId: judgeId,
              championshipId,
              role: { code: 'judge' },
            },
          },
        },
      },
      orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
      select: {
        ...judgeWorkSelect,
        judgeScores: {
          where: { judgeId },
          select: {
            id: true,
            score: true,
            comment: true,
            isFinal: true,
            finalizedAt: true,
            updatedAt: true,
          },
          take: 1,
        },
      },
    });
    return works.map((w) => ({
      ...w,
      myScore: w.judgeScores[0] ?? null,
      judgeScores: undefined,
    }));
  }

  async getJudgeWork(championshipId: number, workId: number, judgeId: number) {
    const row = await this.prisma.work.findFirst({
      where: {
        id: workId,
        championshipId,
      },
      select: {
        ...judgeWorkSelect,
        judgeScores: {
          where: { judgeId },
          select: {
            id: true,
            score: true,
            comment: true,
            isFinal: true,
            finalizedAt: true,
            updatedAt: true,
          },
          take: 1,
        },
      },
    });
    if (!row) throw new NotFoundException('Работа не найдена');
    await this.assertJudgeAccess(judgeId, championshipId, row.nominationId);
    if (row.status !== WorkStatus.SUBMITTED) {
      throw new BadRequestException('Работа недоступна для оценки');
    }
    return {
      ...row,
      myScore: row.judgeScores[0] ?? null,
      judgeScores: undefined,
    };
  }

  async upsertScore(
    championshipId: number,
    workId: number,
    judgeId: number,
    dto: UpsertJudgeScoreDto,
  ) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    if (ch.status !== ChampionshipStatus.JUDGING) {
      throw new BadRequestException(
        'Черновое сохранение оценки доступно только на этапе судейства',
      );
    }
    const work = await this.prisma.work.findFirst({
      where: { id: workId, championshipId },
      select: { id: true, nominationId: true, status: true },
    });
    if (!work) throw new NotFoundException('Работа не найдена');
    await this.assertJudgeAccess(judgeId, championshipId, work.nominationId);
    if (work.status !== WorkStatus.SUBMITTED) {
      throw new BadRequestException(
        'Можно оценивать только отправленные работы',
      );
    }

    const existing = await this.prisma.judgeScore.findUnique({
      where: { workId_judgeId: { workId, judgeId } },
      select: { id: true, isFinal: true },
    });
    if (existing?.isFinal) {
      throw new BadRequestException(
        'Оценка уже финализирована и недоступна для изменения',
      );
    }

    return this.prisma.judgeScore.upsert({
      where: {
        workId_judgeId: { workId, judgeId },
      },
      update: {
        score: dto.score,
        comment: dto.comment?.trim() || null,
        isFinal: false,
        finalizedAt: null,
      },
      create: {
        workId,
        judgeId,
        score: dto.score,
        comment: dto.comment?.trim() || null,
        isFinal: false,
        finalizedAt: null,
      },
      select: {
        id: true,
        workId: true,
        judgeId: true,
        score: true,
        comment: true,
        isFinal: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async finalizeScore(championshipId: number, workId: number, judgeId: number) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    if (ch.status !== ChampionshipStatus.JUDGING) {
      throw new BadRequestException(
        'Финализация оценки доступна только на этапе судейства',
      );
    }
    const work = await this.prisma.work.findFirst({
      where: { id: workId, championshipId },
      select: { id: true, nominationId: true, status: true },
    });
    if (!work) throw new NotFoundException('Работа не найдена');
    await this.assertJudgeAccess(judgeId, championshipId, work.nominationId);
    if (work.status !== WorkStatus.SUBMITTED) {
      throw new BadRequestException(
        'Можно финализировать только отправленные работы',
      );
    }
    const existing = await this.prisma.judgeScore.findUnique({
      where: { workId_judgeId: { workId, judgeId } },
      select: { id: true, isFinal: true },
    });
    if (!existing) {
      throw new BadRequestException(
        'Сначала сохраните черновую оценку, затем финализируйте',
      );
    }
    if (existing.isFinal) {
      return this.prisma.judgeScore.findUnique({
        where: { workId_judgeId: { workId, judgeId } },
        select: {
          id: true,
          workId: true,
          judgeId: true,
          score: true,
          comment: true,
          isFinal: true,
          finalizedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    return this.prisma.judgeScore.update({
      where: { workId_judgeId: { workId, judgeId } },
      data: {
        isFinal: true,
        finalizedAt: new Date(),
      },
      select: {
        id: true,
        workId: true,
        judgeId: true,
        score: true,
        comment: true,
        isFinal: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
