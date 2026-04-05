import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  login!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  surname!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1_000_000_000)
  @Max(Number.MAX_SAFE_INTEGER)
  phone!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tg?: string;
}
