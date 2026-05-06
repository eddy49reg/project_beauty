import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import {
  CHAMPIONSHIP_STATUSES,
  type ChampionshipStatus,
} from './championship-status';

export class ListChampionshipsQueryDto {
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').toUpperCase())
  @IsEnum(CHAMPIONSHIP_STATUSES)
  status?: ChampionshipStatus;
}
