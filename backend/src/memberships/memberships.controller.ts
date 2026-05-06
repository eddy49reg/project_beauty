import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizerOrAdminGuard } from '../auth/guards/organizer-or-admin.guard';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('championships/:championshipId/memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  list(@Param('championshipId', ParseIntPipe) championshipId: number) {
    return this.membershipsService.listForChampionship(championshipId);
  }

  @Post()
  @UseGuards(OrganizerOrAdminGuard)
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.membershipsService.create(championshipId, dto);
  }

  @Delete(':membershipId')
  @UseGuards(OrganizerOrAdminGuard)
  async remove(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
  ) {
    await this.membershipsService.remove(championshipId, membershipId);
    return { ok: true };
  }
}
