import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateMembershipDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  nominationId!: number;
}
