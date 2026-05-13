import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChampionshipStatus, Prisma } from '@prisma/client';
import type { AppUserRole } from '../common/app-user-role';
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

  /**
   * Администратор / глобальный организатор (appRole) или организатор чемпионата по membership.
   */
  async assertUserCanManageChampionship(
    actorId: number,
    appRole: AppUserRole,
    championshipId: number,
  ): Promise<void> {
    if (appRole === 'ADMIN' || appRole === 'ORGANIZER') {
      return;
    }
    const m = await this.prisma.championshipMembership.findFirst({
      where: {
        championshipId,
        userId: actorId,
        role: { code: 'organizer' },
      },
      select: { id: true },
    });
    if (!m) {
      throw new ForbiddenException(
        'Нет прав на управление этим чемпионатом (нужен администратор, глобальный организатор или организатор чемпионата)',
      );
    }
  }

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

  list(userId: number, appRole: AppUserRole, query: ListChampionshipsQueryDto) {
    return this.listForUser(userId, appRole, query);
  }

  private buildRoleMap(
    memberships: {
      championshipId: number;
      role: { code: string };
    }[],
  ): Map<number, Set<string>> {
    const roleByChamp = new Map<number, Set<string>>();
    for (const m of memberships) {
      if (!roleByChamp.has(m.championshipId)) {
        roleByChamp.set(m.championshipId, new Set());
      }
      roleByChamp.get(m.championshipId)!.add(m.role.code);
    }
    return roleByChamp;
  }

  /** Контекст membership пользователя для фильтров списка и GET одного чемпионата. */
  private async getUserChampionshipVisibilityContext(userId: number) {
    const memberships = await this.prisma.championshipMembership.findMany({
      where: { userId },
      select: {
        championshipId: true,
        role: { select: { code: true } },
      },
    });
    const roleByChamp = this.buildRoleMap(memberships);
    const orgIds = new Set<number>();
    const anyMembershipChampIds = new Set<number>();
    for (const m of memberships) {
      anyMembershipChampIds.add(m.championshipId);
      if (m.role.code === 'organizer') {
        orgIds.add(m.championshipId);
      }
    }
    return { roleByChamp, orgIds, anyMembershipChampIds };
  }

  /**
   * Просмотр одного чемпионата: те же правила, что и у списка для USER;
   * ADMIN и глобальный ORGANIZER видят любой чемпионат (как и при управлении).
   */
  private canUserViewChampionship(
    appRole: AppUserRole,
    ch: { id: number; status: ChampionshipStatus },
    ctx: { orgIds: Set<number>; anyMembershipChampIds: Set<number> },
  ): boolean {
    if (appRole === 'ADMIN' || appRole === 'ORGANIZER') {
      return true;
    }
    if (ch.status === 'REGISTRATION') {
      return true;
    }
    if (ch.status === 'DRAFT') {
      return ctx.orgIds.has(ch.id);
    }
    if (
      ch.status === 'JUDGING' ||
      ch.status === 'PUBLISHED' ||
      ch.status === 'ARCHIVED'
    ) {
      return ctx.anyMembershipChampIds.has(ch.id);
    }
    return false;
  }

  /**
   * Кнопка «Подать заявку» в каталоге: период регистрации, нет ролей в чемпионате,
   * не админ и не глобальный организатор (им назначают иначе).
   */
  private computeCanApplyAsParticipant(
    championship: {
      status: ChampionshipStatus;
      registrationStartAt: Date;
      registrationEndAt: Date;
    },
    hasAnyMembership: boolean,
    appRole: AppUserRole,
  ): boolean {
    if (appRole === 'ADMIN' || appRole === 'ORGANIZER') {
      return false;
    }
    const now = new Date();
    const regStart = new Date(championship.registrationStartAt);
    const regEnd = new Date(championship.registrationEndAt);
    const inRegWindow =
      championship.status === 'REGISTRATION' &&
      now >= regStart &&
      now <= regEnd;
    return inRegWindow && !hasAnyMembership;
  }

  /**
   * Контакт организатора для текстовой инструкции «обратитесь в Telegram».
   * Только при тех же условиях, что и кнопка «Подать заявку на участие».
   */
  async getRegistrationContact(
    id: number,
    userId: number,
    appRole: AppUserRole,
  ): Promise<{
    organizerTelegram: string | null;
    organizerDisplayName: string | null;
  }> {
    const championship = await this.prisma.championship.findUnique({
      where: { id },
      select: championshipSelect,
    });
    if (!championship) {
      throw new NotFoundException('Чемпионат не найден');
    }
    const ctx = await this.getUserChampionshipVisibilityContext(userId);
    if (!this.canUserViewChampionship(appRole, championship, ctx)) {
      throw new ForbiddenException(
        'Нет прав на просмотр контактов этого чемпионата',
      );
    }
    const myRoleCodes = [
      ...(ctx.roleByChamp.get(championship.id) ?? []),
    ].sort();
    const hasAnyMembership = myRoleCodes.length > 0;
    if (
      !this.computeCanApplyAsParticipant(
        championship,
        hasAnyMembership,
        appRole,
      )
    ) {
      throw new ForbiddenException(
        'Инструкция по регистрации доступна только в период регистрации и если у вас ещё нет роли в этом чемпионате',
      );
    }

    const row = await this.prisma.championshipMembership.findFirst({
      where: {
        championshipId: id,
        role: { code: 'organizer' },
      },
      orderBy: { id: 'asc' },
      select: {
        user: {
          select: { tg: true, firstname: true, surname: true },
        },
      },
    });
    const u = row?.user;
    const organizerDisplayName = u
      ? `${u.firstname} ${u.surname}`.trim() || null
      : null;
    const organizerTelegram = u?.tg?.trim() || null;
    return { organizerTelegram, organizerDisplayName };
  }

  private async listForUser(
    userId: number,
    appRole: AppUserRole,
    query: ListChampionshipsQueryDto,
  ) {
    const { roleByChamp, orgIds, anyMembershipChampIds } =
      await this.getUserChampionshipVisibilityContext(userId);

    let where: Prisma.ChampionshipWhereInput;

    if (appRole === 'ADMIN') {
      where =
        query.status !== undefined && String(query.status).length > 0
          ? { status: query.status as ChampionshipStatus }
          : {};
    } else {
      const or: Prisma.ChampionshipWhereInput[] = [{ status: 'REGISTRATION' }];
      if (orgIds.size > 0) {
        or.push({ status: 'DRAFT', id: { in: [...orgIds] } });
      }
      if (anyMembershipChampIds.size > 0) {
        or.push({
          status: { in: ['JUDGING', 'PUBLISHED', 'ARCHIVED'] },
          id: { in: [...anyMembershipChampIds] },
        });
      }
      where = { OR: or };
    }

    const rows = await this.prisma.championship.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: championshipSelect,
    });

    return rows.map((row) => {
      const myRoleCodes = [...(roleByChamp.get(row.id) ?? [])].sort();
      const hasAnyMembership = myRoleCodes.length > 0;
      const canApplyAsParticipant = this.computeCanApplyAsParticipant(
        row,
        hasAnyMembership,
        appRole,
      );

      return {
        ...row,
        myRoleCodes,
        canApplyAsParticipant,
      };
    });
  }

  async findOne(id: number, userId: number, appRole: AppUserRole) {
    const championship = await this.prisma.championship.findUnique({
      where: { id },
      select: championshipSelect,
    });
    if (!championship) {
      throw new NotFoundException('Чемпионат не найден');
    }
    const ctx = await this.getUserChampionshipVisibilityContext(userId);
    if (!this.canUserViewChampionship(appRole, championship, ctx)) {
      throw new ForbiddenException(
        'Нет прав на просмотр этого чемпионата (черновик — только организатору чемпионата или администратору; остальные статусы без вашей роли в событии недоступны)',
      );
    }
    const myRoleCodes = [
      ...(ctx.roleByChamp.get(championship.id) ?? []),
    ].sort();
    const hasAnyMembership = myRoleCodes.length > 0;
    const canApplyAsParticipant = this.computeCanApplyAsParticipant(
      championship,
      hasAnyMembership,
      appRole,
    );

    return {
      ...championship,
      myRoleCodes,
      canApplyAsParticipant,
    };
  }

  async update(
    id: number,
    dto: UpdateChampionshipDto,
    actorId: number,
    appRole: AppUserRole,
  ) {
    await this.assertUserCanManageChampionship(actorId, appRole, id);
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

  async archive(id: number, actorId: number, appRole: AppUserRole) {
    await this.assertUserCanManageChampionship(actorId, appRole, id);
    const existing = await this.prisma.championship.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Чемпионат не найден');
    }
    if (existing.status === 'ARCHIVED') {
      const row = await this.prisma.championship.findUnique({
        where: { id },
        select: championshipSelect,
      });
      if (!row) {
        throw new NotFoundException('Чемпионат не найден');
      }
      return row;
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
