import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { ResultsService } from './results.service';

@Controller('championships/:championshipId/results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  getByNomination(
    @Param('championshipId', ParseIntPipe) championshipId: number,
    @CurrentUser() actor: JwtAccessPayload,
  ) {
    return this.resultsService.getByNomination(championshipId, actor);
  }
}
