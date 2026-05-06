export const APP_SHELL_BRAND_TITLE = 'Beauty Cup';

export const APP_SHELL_NAV_LINKS = [
  { to: '/', label: 'Главная' },
  { to: '/login', label: 'Вход' },
  { to: '/register', label: 'Регистрация' },
] as const;

export const APP_SHELL_ADMIN_NAV = {
  to: '/admin/users',
  label: 'Админ',
} as const;
