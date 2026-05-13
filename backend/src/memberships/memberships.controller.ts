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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
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
  create(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Body() dto: CreateMembershipDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.membershipsService.create(
      championshipId,
      dto,
      user.sub,
      user.appRole,
    );
  }

  @Delete(':membershipId')
  async remove(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.membershipsService.remove(
      championshipId,
      membershipId,
      user.sub,
      user.appRole,
    );
    return { ok: true };
  }
}
