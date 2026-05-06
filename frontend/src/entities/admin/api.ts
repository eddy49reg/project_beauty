import { api } from '../../lib/api';
import type { UserAppRole } from '../auth/types';
import type { AdminUserRow } from './types';

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { data } = await api.get<AdminUserRow[]>('/admin/users');
  return data;
}

export async function patchUserAppRole(
  userId: number,
  appRole: UserAppRole,
): Promise<AdminUserRow> {
  const { data } = await api.patch<AdminUserRow>(
    `/admin/users/${userId}/app-role`,
    { appRole },
  );
  return data;
}
