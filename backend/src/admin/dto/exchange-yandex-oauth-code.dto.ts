import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** Код подтверждения со страницы Яндекс OAuth (после redirect на verification_code). */
export class ExchangeYandexOAuthCodeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(4096)
  code!: string;
}
