/** Совпадает с Prisma `UserAppRole`. */
export type UserAppRole = 'USER' | 'ORGANIZER' | 'ADMIN';

export type AuthUser = {
  id: number;
  login: string;
  firstname: string;
  surname: string;
  phone: string;
  tg: string | null;
  appRole?: UserAppRole;
};

export type LoginBody = {
  login: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

/** Тело POST /auth/register */
export type RegisterBody = {
  login: string;
  password: string;
  firstname: string;
  surname: string;
  phone: string;
  tg?: string;
};

export type RegisterResponse = LoginResponse;
