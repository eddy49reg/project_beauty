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
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';
import { NominationsService } from './nominations.service';

@Controller('championships/:championshipId/nominations')
@UseGuards(JwtAuthGuard)
export class NominationsController {
  constructor(private readonly nominationsService: NominationsService) {}

  @Get()
  list(@Param('championshipId', ParseIntPipe) championshipId: number) {
    return this.nominationsService.listForChampionship(championshipId);
  }

  @Get(':nominationId')
  findOne(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('nominationId', ParseIntPipe) nominationId: number,
  ) {
    return this.nominationsService.findOne(championshipId, nominationId);
  }

  @Post()
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Body() dto: CreateNominationDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.nominationsService.create(
      championshipId,
      dto,
      user.sub,
      user.appRole,
    );
  }

  @Patch(':nominationId')
  update(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('nominationId', ParseIntPipe) nominationId: number,
    @Body() dto: UpdateNominationDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.nominationsService.update(
      championshipId,
      nominationId,
      dto,
      user.sub,
      user.appRole,
    );
  }

  @Delete(':nominationId')
  async remove(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('nominationId', ParseIntPipe) nominationId: number,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.nominationsService.remove(
      championshipId,
      nominationId,
      user.sub,
      user.appRole,
    );
    return { ok: true };
  }
}
