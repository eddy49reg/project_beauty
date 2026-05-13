import { api } from '../../lib/api';
import type {
  ChampionshipRegistrationContact,
  ChampionshipRow,
  ChampionshipStatus,
  CreateChampionshipBody,
  UpdateChampionshipBody,
} from './types';

export async function getChampionships(params?: {
  status?: ChampionshipStatus;
}): Promise<ChampionshipRow[]> {
  const { data } = await api.get<ChampionshipRow[]>('/championships', {
    params: params?.status ? { status: params.status } : undefined,
  });
  return data;
}

export async function getChampionship(id: number): Promise<ChampionshipRow> {
  const { data } = await api.get<ChampionshipRow>(`/championships/${id}`);
  return data;
}

export async function getRegistrationContact(
  id: number,
): Promise<ChampionshipRegistrationContact> {
  const { data } = await api.get<ChampionshipRegistrationContact>(
    `/championships/${id}/registration-contact`,
  );
  return data;
}

export async function postChampionship(
  body: CreateChampionshipBody,
): Promise<ChampionshipRow> {
  const { data } = await api.post<ChampionshipRow>('/championships', body);
  return data;
}

export async function patchChampionship(
  id: number,
  body: UpdateChampionshipBody,
): Promise<ChampionshipRow> {
  const { data } = await api.patch<ChampionshipRow>(
    `/championships/${id}`,
    body,
  );
  return data;
}

export async function archiveChampionship(
  id: number,
): Promise<ChampionshipRow> {
  const { data } = await api.patch<ChampionshipRow>(
    `/championships/${id}/archive`,
  );
  return data;
}
