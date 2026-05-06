import { api } from '../../lib/api';
import type { UserDirectoryRow } from './types';

export async function getUserDirectory(): Promise<UserDirectoryRow[]> {
  const { data } = await api.get<UserDirectoryRow[]>('/users');
  return data;
}
