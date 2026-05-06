import type { UserAppRole } from '../auth/types';

export type AdminUserRow = {
  id: number;
  login: string;
  firstname: string;
  surname: string;
  phone: string;
  tg: string | null;
  appRole: UserAppRole;
  createdAt: string;
};
