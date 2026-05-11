import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { UpsertJudgeScoreDto } from './dto/upsert-judge-score.dto';
import { JudgingService } from './judging.service';

@Controller('championships/:championshipId/judging')
@UseGuards(JwtAuthGuard)
export class JudgingController {
  constructor(private readonly judgingService: JudgingService) {}

  @Get('works')
  listWorks(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.judgingService.listJudgeWorks(championshipId, actor.sub);
  }

  @Get('works/:workId')
  getWork(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.judgingService.getJudgeWork(championshipId, workId, actor.sub);
  }

  @Put('works/:workId/score')
  upsertScore(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
    @Body() dto: UpsertJudgeScoreDto,
  ) {
    return this.judgingService.upsertScore(
      championshipId,
      workId,
      actor.sub,
      dto,
    );
  }

  @Post('works/:workId/score/finalize')
  finalizeScore(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.judgingService.finalizeScore(championshipId, workId, actor.sub);
  }
}
