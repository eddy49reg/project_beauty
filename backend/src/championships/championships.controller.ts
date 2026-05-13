import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizerOrAdminGuard } from '../auth/guards/organizer-or-admin.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { ChampionshipsService } from './championships.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { ListChampionshipsQueryDto } from './dto/list-championships.query.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@Controller('championships')
@UseGuards(JwtAuthGuard)
export class ChampionshipsController {
  constructor(private readonly championshipsService: ChampionshipsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListChampionshipsQueryDto,
  ) {
    return this.championshipsService.list(user.sub, user.appRole, query);
  }

  @Get(':id/registration-contact')
  registrationContact(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.championshipsService.getRegistrationContact(
      id,
      user.sub,
      user.appRole,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.championshipsService.findOne(id, user.sub, user.appRole);
  }

  @Post()
  @UseGuards(OrganizerOrAdminGuard)
  create(@Body() dto: CreateChampionshipDto) {
    return this.championshipsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChampionshipDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.championshipsService.update(id, dto, user.sub, user.appRole);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.championshipsService.archive(id, user.sub, user.appRole);
  }
}
