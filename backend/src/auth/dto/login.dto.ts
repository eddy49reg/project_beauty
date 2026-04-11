import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOGIN_RE } from '../lib/auth-patterns';

export class LoginDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(LOGIN_RE, {
    message: 'Логин: 3–50 символов, латиница, цифры, знаки _ и -',
  })
  login!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
