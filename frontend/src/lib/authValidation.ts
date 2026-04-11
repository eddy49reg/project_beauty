/** Соответствует правилам RegisterDto / LoginDto на бэкенде. */
export const LOGIN_RE = /^[a-zA-Z0-9_-]{3,50}$/;
export const LOGIN_RE_MESSAGE =
  'Логин: 3–50 символов, латиница, цифры, знаки _ и -';

export const NAME_RE = /^[\p{L}\s'-]{1,100}$/u;
export const NAME_RE_MESSAGE =
  'Только буквы (в т.ч. кириллица), пробел, дефис, апостроф';

export const TG_USERNAME_RE = /^@[a-z0-9_]{5,32}$/;
export const TG_USERNAME_MESSAGE =
  'Telegram: @username латиницей, 5–32 символа после @ (a-z, цифры, _)';
