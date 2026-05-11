import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChampionshipStatus } from '@prisma/client';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChampionshipOrThrow(championshipId: number) {
    const row = await this.prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true, title: true, status: true },
    });
    if (!row) throw new NotFoundException('Чемпионат не найден');
    return row;
  }

  private assertCanViewResults(
    chStatus: ChampionshipStatus,
    actor: JwtAccessPayload,
  ) {
    if (
      chStatus === ChampionshipStatus.PUBLISHED ||
      chStatus === ChampionshipStatus.ARCHIVED
    ) {
      return;
    }
    if (actor.appRole === 'ADMIN' || actor.appRole === 'ORGANIZER') {
      return;
    }
    throw new ForbiddenException(
      'Результаты еще не опубликованы. Доступны только организатору или администратору',
    );
  }

  async getByNomination(championshipId: number, actor: JwtAccessPayload) {
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertCanViewResults(ch.status, actor);

    const works = await this.prisma.work.findMany({
      where: {
        championshipId,
        status: 'SUBMITTED',
      },
      orderBy: [{ nominationId: 'asc' }, { submittedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        submittedAt: true,
        nominationId: true,
        nomination: { select: { id: true, title: true } },
        author: {
          select: { id: true, login: true, firstname: true, surname: true },
        },
        judgeScores: {
          where: { isFinal: true },
          select: { id: true, score: true, judgeId: true },
        },
      },
    });

    const grouped = new Map<
      number,
      {
        nominationId: number;
        nominationTitle: string;
        rows: Array<{
          workId: number;
          workTitle: string;
          authorId: number;
          authorName: string;
          authorLogin: string;
          submittedAt: string | null;
          scoresCount: number;
          averageScore: number | null;
          rank: number | null;
        }>;
      }
    >();

    for (const w of works) {
      const avg =
        w.judgeScores.length > 0
          ? Number(
              (
                w.judgeScores.reduce((sum, s) => sum + s.score, 0) /
                w.judgeScores.length
              ).toFixed(2),
            )
          : null;
      const row = {
        workId: w.id,
        workTitle: w.title,
        authorId: w.author.id,
        authorName: `${w.author.surname} ${w.author.firstname}`,
        authorLogin: w.author.login,
        submittedAt: w.submittedAt ? w.submittedAt.toISOString() : null,
        scoresCount: w.judgeScores.length,
        averageScore: avg,
        rank: null as number | null,
      };
      const bucket = grouped.get(w.nominationId);
      if (bucket) {
        bucket.rows.push(row);
      } else {
        grouped.set(w.nominationId, {
          nominationId: w.nomination.id,
          nominationTitle: w.nomination.title,
          rows: [row],
        });
      }
    }

    const nominations = [...grouped.values()].map((g) => {
      const sorted = [...g.rows].sort((a, b) => {
        const as = a.averageScore ?? -1;
        const bs = b.averageScore ?? -1;
        if (bs !== as) return bs - as;
        if (a.submittedAt && b.submittedAt && a.submittedAt !== b.submittedAt) {
          return a.submittedAt.localeCompare(b.submittedAt);
        }
        return a.workId - b.workId;
      });
      let lastScore: number | null = null;
      let rank = 0;
      sorted.forEach((row, idx) => {
        if (row.averageScore === null) {
          row.rank = null;
          return;
        }
        if (lastScore === null || row.averageScore !== lastScore) {
          rank = idx + 1;
          lastScore = row.averageScore;
        }
        row.rank = rank;
      });
      return {
        nominationId: g.nominationId,
        nominationTitle: g.nominationTitle,
        rows: sorted,
      };
    });

    return {
      championship: { id: ch.id, title: ch.title, status: ch.status },
      nominations,
    };
  }
}
