export const APP_SHELL_BRAND_TITLE = 'Beauty Cup';

/** Ссылки для гостя (без сессии) */
export const APP_SHELL_GUEST_NAV = [
  { to: '/', label: 'Главная' },
  { to: '/login', label: 'Вход' },
  { to: '/register', label: 'Регистрация' },
] as const;

/** Ссылки для авторизованного пользователя */
export const APP_SHELL_USER_NAV = [
  { to: '/', label: 'Главная' },
  { to: '/championships', label: 'Чемпионаты' },
] as const;

export const APP_SHELL_ADMIN_NAV = {
  to: '/admin/users',
  label: 'Пользователи',
} as const;
