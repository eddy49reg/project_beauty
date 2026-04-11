import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOGIN_RE, NAME_RE, TG_USERNAME_RE } from '../lib/auth-patterns';
import { parseToE164 } from '../lib/phone-e164';

export class RegisterDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Matches(LOGIN_RE, {
    message: 'Логин: 3–50 символов, латиница, цифры, знаки _ и -',
  })
  login!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(NAME_RE, {
    message: 'Имя: буквы (в т.ч. кириллица), пробел, дефис, апостроф',
  })
  firstname!: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(NAME_RE, {
    message: 'Фамилия: буквы (в т.ч. кириллица), пробел, дефис, апостроф',
  })
  surname!: string;

  @Transform(({ value }) => parseToE164(String(value ?? '')) ?? '')
  @IsString()
  @IsNotEmpty({
    message:
      'Телефон: укажите корректный номер (РФ без кода страны или международный, например +44…)',
  })
  phone!: string;

  @Transform(({ value }) => {
    if (value == null || String(value).trim() === '') return undefined;
    return String(value).trim().toLowerCase();
  })
  @IsOptional()
  @IsString()
  @Matches(TG_USERNAME_RE, {
    message:
      'Telegram: укажите @username латиницей (5–32 символа после @, только a-z, цифры, _)',
  })
  tg?: string;
}
