import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkStatus } from '@prisma/client';
import type { AppUserRole } from '../common/app-user-role';
import { PrismaService } from '../prisma/prisma.service';
import { YandexDiskService } from '../storage/yandex-disk.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import type { MemoryUploadedFile } from './types/uploaded-file';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_ATTACHMENTS_PER_WORK = 10;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const workAttachmentSelect = {
  id: true,
  diskPath: true,
  viewUrl: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
} as const;

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
  attachments: {
    select: workAttachmentSelect,
    orderBy: { id: 'asc' as const },
  },
} as const;

function safeImageFileName(original: string): string {
  const base = original.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return `${Date.now()}_${base || 'image'}`;
}

function assertImageFileAllowed(file: MemoryUploadedFile): string {
  const mime = file.mimetype?.toLowerCase() ?? '';
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new BadRequestException(
      'Допустимы только изображения: JPEG, PNG, WebP, GIF',
    );
  }
  if (!file.buffer?.length) {
    throw new BadRequestException('Пустой файл');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new BadRequestException(
      `Размер файла не более ${MAX_IMAGE_BYTES / (1024 * 1024)} МБ`,
    );
  }
  return mime;
}

@Injectable()
export class WorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yandexDisk: YandexDiskService,
  ) {}

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

  /**
   * Создание черновика и загрузка фото в одном сценарии: при любой ошибке после
   * создания работы — удаляем запись в БД и уже залитые на Диск файлы (компенсация).
   */
  async createWithAttachments(
    championshipId: number,
    actorId: number,
    dto: CreateWorkDto,
    files: MemoryUploadedFile[],
  ) {
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

    const diskOn = await this.yandexDisk.isWorkPhotoUploadReady();
    if (diskOn) {
      if (files.length < 1) {
        throw new BadRequestException(
          'Добавьте хотя бы одно изображение работы (загрузка на Яндекс.Диск).',
        );
      }
      if (files.length > MAX_ATTACHMENTS_PER_WORK) {
        throw new BadRequestException(
          `Не более ${MAX_ATTACHMENTS_PER_WORK} файлов на одну работу`,
        );
      }
      for (const f of files) {
        assertImageFileAllowed(f);
      }
    } else if (files.length > 0) {
      throw new BadRequestException(
        'Загрузка файлов на сервере отключена. Уберите файлы из запроса.',
      );
    }

    let workId: number | null = null;
    const uploadedDiskPaths: string[] = [];

    try {
      const work = await this.prisma.work.create({
        data: {
          championshipId,
          nominationId: dto.nominationId,
          authorId: actorId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          status: WorkStatus.DRAFT,
        },
        select: { id: true },
      });
      workId = work.id;

      if (diskOn) {
        for (let i = 0; i < files.length; i += 1) {
          const file = files[i];
          if (!file) {
            continue;
          }
          const mime = assertImageFileAllowed(file);
          const safeName = safeImageFileName(
            `${i}_${file.originalname || 'photo.jpg'}`,
          );
          const diskPath = this.yandexDisk.buildObjectPath(
            championshipId,
            workId,
            safeName,
          );
          const href = await this.yandexDisk.getUploadHref(diskPath);
          await this.yandexDisk.putFile(href, file.buffer, mime);
          uploadedDiskPaths.push(diskPath);
          const viewUrl =
            (await this.yandexDisk.publishAndResolvePublicUrl(diskPath)) ??
            null;
          await this.prisma.workAttachment.create({
            data: {
              workId,
              diskPath,
              viewUrl,
              originalName: file.originalname?.slice(0, 255) || safeName,
              mimeType: mime,
              sizeBytes: file.size,
            },
          });
        }
      }
    } catch (e: unknown) {
      for (const path of uploadedDiskPaths) {
        await this.yandexDisk.deleteResource(path).catch(() => undefined);
      }
      if (workId !== null) {
        await this.prisma.work
          .delete({ where: { id: workId } })
          .catch(() => undefined);
      }
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Для этой номинации у вас уже есть работа',
        );
      }
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(
        `Не удалось создать работу с вложениями: ${msg}`,
      );
    }

    if (workId === null) {
      throw new BadRequestException(
        'Не удалось создать работу с вложениями: внутренняя ошибка.',
      );
    }
    return this.findMyOne(championshipId, workId, actorId);
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

  async uploadAttachment(
    championshipId: number,
    workId: number,
    actorId: number,
    file: MemoryUploadedFile,
  ) {
    await this.yandexDisk.assertConfigured();
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);

    const work = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: { id: true, status: true, nominationId: true },
    });
    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }
    if (work.status !== WorkStatus.DRAFT) {
      throw new BadRequestException(
        'Добавлять фото можно только к черновику работы',
      );
    }

    const mime = assertImageFileAllowed(file);

    const count = await this.prisma.workAttachment.count({
      where: { workId },
    });
    if (count >= MAX_ATTACHMENTS_PER_WORK) {
      throw new BadRequestException(
        `Не более ${MAX_ATTACHMENTS_PER_WORK} файлов на одну работу`,
      );
    }

    const safeName = safeImageFileName(file.originalname || 'photo.jpg');
    const diskPath = this.yandexDisk.buildObjectPath(
      championshipId,
      workId,
      safeName,
    );

    try {
      const href = await this.yandexDisk.getUploadHref(diskPath);
      await this.yandexDisk.putFile(href, file.buffer, mime);
      const viewUrl =
        (await this.yandexDisk.publishAndResolvePublicUrl(diskPath)) ?? null;

      return await this.prisma.workAttachment.create({
        data: {
          workId,
          diskPath,
          viewUrl,
          originalName: file.originalname?.slice(0, 255) || safeName,
          mimeType: mime,
          sizeBytes: file.size,
        },
        select: workAttachmentSelect,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(
        `Не удалось загрузить файл в Яндекс.Диск: ${msg}`,
      );
    }
  }

  async deleteAttachment(
    championshipId: number,
    workId: number,
    attachmentId: number,
    actorId: number,
  ) {
    await this.yandexDisk.assertConfigured();
    const ch = await this.getChampionshipOrThrow(championshipId);
    this.assertBeforeDeadline(ch.registrationEndAt);

    const work = await this.prisma.work.findFirst({
      where: { id: workId, championshipId, authorId: actorId },
      select: { id: true, status: true },
    });
    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }
    if (work.status !== WorkStatus.DRAFT) {
      throw new BadRequestException(
        'Удалять фото можно только у черновика работы',
      );
    }

    const row = await this.prisma.workAttachment.findFirst({
      where: { id: attachmentId, workId },
      select: { id: true, diskPath: true },
    });
    if (!row) {
      throw new NotFoundException('Вложение не найдено');
    }

    if (await this.yandexDisk.isWorkPhotoUploadReady()) {
      await this.yandexDisk.deleteResource(row.diskPath).catch(() => undefined);
    }
    await this.prisma.workAttachment.delete({ where: { id: row.id } });
    return { ok: true };
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

    if (await this.yandexDisk.isWorkPhotoUploadReady()) {
      const imageCount = await this.prisma.workAttachment.count({
        where: {
          workId,
          mimeType: { in: [...ALLOWED_IMAGE_MIMES] },
        },
      });
      if (imageCount < 1) {
        throw new BadRequestException(
          'Перед отправкой добавьте хотя бы одно фото работы (загрузка в Яндекс.Диск).',
        );
      }
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

    const atts = await this.prisma.workAttachment.findMany({
      where: { workId },
      select: { diskPath: true },
    });
    if (await this.yandexDisk.isWorkPhotoUploadReady()) {
      for (const a of atts) {
        await this.yandexDisk.deleteResource(a.diskPath).catch(() => undefined);
      }
    }
    await this.prisma.work.delete({ where: { id: workId } });
  }

  private async assertCanViewWorkAttachment(
    actorId: number,
    actorRole: AppUserRole,
    championshipId: number,
    work: {
      id: number;
      authorId: number;
      status: WorkStatus;
      nominationId: number;
    },
  ): Promise<void> {
    if (work.authorId === actorId) {
      return;
    }
    if (actorRole === 'ADMIN') {
      return;
    }
    if (work.status !== WorkStatus.SUBMITTED) {
      throw new ForbiddenException('Нет доступа к вложениям этой работы');
    }
    if (actorRole === 'ORGANIZER') {
      const org = await this.prisma.championshipMembership.findFirst({
        where: {
          userId: actorId,
          championshipId,
          role: { code: 'organizer' },
        },
        select: { id: true },
      });
      if (org) {
        return;
      }
    }
    const judge = await this.prisma.championshipMembership.findFirst({
      where: {
        userId: actorId,
        championshipId,
        nominationId: work.nominationId,
        role: { code: 'judge' },
      },
      select: { id: true },
    });
    if (judge) {
      return;
    }
    throw new ForbiddenException('Нет доступа к вложениям этой работы');
  }

  async getAttachmentFileResponse(
    championshipId: number,
    workId: number,
    attachmentId: number,
    actorId: number,
    actorRole: AppUserRole,
  ): Promise<{ body: Buffer; contentType: string }> {
    const row = await this.prisma.workAttachment.findFirst({
      where: { id: attachmentId, workId },
      select: {
        diskPath: true,
        mimeType: true,
        work: {
          select: {
            id: true,
            championshipId: true,
            authorId: true,
            status: true,
            nominationId: true,
          },
        },
      },
    });
    if (
      !row ||
      row.work.championshipId !== championshipId ||
      row.work.id !== workId
    ) {
      throw new NotFoundException('Вложение не найдено');
    }
    await this.assertCanViewWorkAttachment(
      actorId,
      actorRole,
      championshipId,
      row.work,
    );
    try {
      const { body, contentType } = await this.yandexDisk.fetchFileByDiskPath(
        row.diskPath,
      );
      const ct =
        row.mimeType && ALLOWED_IMAGE_MIMES.has(row.mimeType)
          ? row.mimeType
          : contentType;
      return { body, contentType: ct };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Не удалось получить файл с Диска: ${msg}`);
    }
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
