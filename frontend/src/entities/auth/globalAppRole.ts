import type { AuthUser } from './types';

/**
 * Действия уровня площадки (создание чемпионата и т.п.): только глобальные роли
 * `User.app_role` в БД — ADMIN или ORGANIZER. Роль «организатор чемпионата»
 * в membership сюда не входит.
 */
export function hasGlobalChampionshipAdminAccess(
  user: AuthUser | null | undefined,
): boolean {
  const r = user?.appRole;
  return r === 'ADMIN' || r === 'ORGANIZER';
}
