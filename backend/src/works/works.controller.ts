import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { WorksService } from './works.service';

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

  @Post()
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @Body() dto: CreateWorkDto,
  ) {
    return this.worksService.create(championshipId, actor.sub, dto);
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

  @Post(':workId/submit')
  submit(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.worksService.submit(championshipId, workId, actor.sub);
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
