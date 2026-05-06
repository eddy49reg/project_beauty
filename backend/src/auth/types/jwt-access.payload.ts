import type { AppUserRole } from '../../common/app-user-role';

export type JwtAccessPayload = {
  sub: number;
  login: string;
  appRole: AppUserRole;
};
