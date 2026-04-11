import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_REGION = 'RU' as const;

export function parseToE164(input: string): string | undefined {
  const s = input.trim();
  if (!s) return undefined;

  let parsed = parsePhoneNumberFromString(s, DEFAULT_REGION);
  if (parsed?.isValid()) return parsed.format('E.164');

  parsed = parsePhoneNumberFromString(s);
  if (parsed?.isValid()) return parsed.format('E.164');

  return undefined;
}
