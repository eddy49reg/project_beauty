import { api } from '../../lib/api';
import type { RoleRow } from './types';

export async function getRoles(): Promise<RoleRow[]> {
  const { data } = await api.get<RoleRow[]>('/roles');
  return data;
}
