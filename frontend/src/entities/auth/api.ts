import { api } from '../../lib/api';
import type {
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from './types';

export async function postLogin(body: LoginBody): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', body);
  return data;
}

export async function postRegister(
  body: RegisterBody,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', {
    ...body,
    tg: body.tg?.trim() ? body.tg.trim() : undefined,
  });
  return data;
}
