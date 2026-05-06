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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizerOrAdminGuard } from '../auth/guards/organizer-or-admin.guard';
import { ChampionshipsService } from './championships.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { ListChampionshipsQueryDto } from './dto/list-championships.query.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@Controller('championships')
@UseGuards(JwtAuthGuard)
export class ChampionshipsController {
  constructor(private readonly championshipsService: ChampionshipsService) {}

  @Get()
  list(@Query() query: ListChampionshipsQueryDto) {
    return this.championshipsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.championshipsService.findOne(id);
  }

  @Post()
  @UseGuards(OrganizerOrAdminGuard)
  create(@Body() dto: CreateChampionshipDto) {
    return this.championshipsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(OrganizerOrAdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChampionshipDto,
  ) {
    return this.championshipsService.update(id, dto);
  }

  @Patch(':id/archive')
  @UseGuards(OrganizerOrAdminGuard)
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.championshipsService.archive(id);
  }
}
