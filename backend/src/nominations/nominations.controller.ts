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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizerOrAdminGuard } from '../auth/guards/organizer-or-admin.guard';
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
  @UseGuards(OrganizerOrAdminGuard)
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Body() dto: CreateNominationDto,
  ) {
    return this.nominationsService.create(championshipId, dto);
  }

  @Patch(':nominationId')
  @UseGuards(OrganizerOrAdminGuard)
  update(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('nominationId', ParseIntPipe) nominationId: number,
    @Body() dto: UpdateNominationDto,
  ) {
    return this.nominationsService.update(championshipId, nominationId, dto);
  }

  @Delete(':nominationId')
  @UseGuards(OrganizerOrAdminGuard)
  async remove(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('nominationId', ParseIntPipe) nominationId: number,
  ) {
    await this.nominationsService.remove(championshipId, nominationId);
    return { ok: true };
  }
}
