import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CHAMPIONSHIP_STATUSES,
  type ChampionshipStatus,
} from './championship-status';

export class CreateChampionshipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsEnum(CHAMPIONSHIP_STATUSES)
  status?: ChampionshipStatus;

  @Type(() => Date)
  @IsDate()
  registrationStartAt!: Date;

  @Type(() => Date)
  @IsDate()
  registrationEndAt!: Date;

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
