import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { MemoryUploadedFile } from './types/uploaded-file';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { WorksService } from './works.service';

const imageFilePipe = new ParseFilePipe({
  validators: [new MaxFileSizeValidator({ maxSize: 12 * 1024 * 1024 })],
});

const maxImageBytes = 12 * 1024 * 1024;
const maxFilesPerWork = 10;

@Controller('championships/:championshipId/works')
@UseGuards(JwtAuthGuard)
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get('my')
  listMy(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.worksService.listMy(championshipId, actor.sub);
  }

  @Get('my/:workId')
  findMyOne(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.worksService.findMyOne(championshipId, workId, actor.sub);
  }

  /** Создание черновика + загрузка фото одним запросом (компенсация при ошибке). */
  @Post('with-attachments')
  @UseInterceptors(
    FilesInterceptor('files', maxFilesPerWork, {
      limits: { fileSize: maxImageBytes },
    }),
  )
  createWithAttachments(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @Body() dto: CreateWorkDto,
    @UploadedFiles() files: MemoryUploadedFile[] | undefined,
  ) {
    return this.worksService.createWithAttachments(
      championshipId,
      actor.sub,
      dto,
      files ?? [],
    );
  }

  @Post()
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @Body() dto: CreateWorkDto,
  ) {
    return this.worksService.create(championshipId, actor.sub, dto);
  }

  @Post(':workId/submit')
  submit(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.worksService.submit(championshipId, workId, actor.sub);
  }

  @Post(':workId/attachments')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 12 * 1024 * 1024 } }),
  )
  uploadAttachment(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @UploadedFile(imageFilePipe) file: MemoryUploadedFile,
  ) {
    return this.worksService.uploadAttachment(
      championshipId,
      workId,
      actor.sub,
      file,
    );
  }

  /** Поток файла с Яндекс.Диска (для превью: фронт качает blob с Bearer, не через публичный yadi.sk). */
  @Get(':workId/attachments/:attachmentId/file')
  async getAttachmentFile(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    const { body, contentType } =
      await this.worksService.getAttachmentFileResponse(
        championshipId,
        workId,
        attachmentId,
        actor.sub,
        actor.appRole,
      );
    return new StreamableFile(body, {
      type: contentType,
      disposition: 'inline',
    });
  }

  @Delete(':workId/attachments/:attachmentId')
  removeAttachment(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.worksService.deleteAttachment(
      championshipId,
      workId,
      attachmentId,
      actor.sub,
    );
  }

  @Patch(':workId')
  update(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @Body() dto: UpdateWorkDto,
  ) {
    return this.worksService.update(championshipId, workId, actor.sub, dto);
  }

  @Delete(':workId')
  async remove(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    await this.worksService.remove(championshipId, workId, actor.sub);
    return { ok: true };
  }
}
