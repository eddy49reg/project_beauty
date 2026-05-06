import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CHAMPIONSHIP_STATUSES,
  type ChampionshipStatus,
} from './championship-status';

export class UpdateChampionshipDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsEnum(CHAMPIONSHIP_STATUSES)
  status?: ChampionshipStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  registrationStartAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  registrationEndAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  judgingStartAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  judgingEndAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  resultPublishedAt?: Date;
}
