import { parsePhoneNumberFromString } from 'libphonenumber-js';

/** Регион по умолчанию, если номер без кода страны (как часто вводят в РФ). */
const DEFAULT_REGION = 'RU' as const;

/**
 * Парсит произвольный ввод и возвращает номер в E.164 (+…), если он валиден.
 * Сначала пробуем как российский номер, затем как международный.
 */
export function parseToE164(input: string): string | undefined {
  const s = input.trim();
  if (!s) return undefined;

  let parsed = parsePhoneNumberFromString(s, DEFAULT_REGION);
  if (parsed?.isValid()) return parsed.format('E.164');

  parsed = parsePhoneNumberFromString(s);
  if (parsed?.isValid()) return parsed.format('E.164');

  return undefined;
}
