import { api } from '../../lib/api';
import type {
  CreateNominationBody,
  NominationRow,
  UpdateNominationBody,
} from './types';

export async function getNominations(
  championshipId: number,
): Promise<NominationRow[]> {
  const { data } = await api.get<NominationRow[]>(
    `/championships/${championshipId}/nominations`,
  );
  return data;
}

export async function getNomination(
  championshipId: number,
  nominationId: number,
): Promise<NominationRow> {
  const { data } = await api.get<NominationRow>(
    `/championships/${championshipId}/nominations/${nominationId}`,
  );
  return data;
}

export async function postNomination(
  championshipId: number,
  body: CreateNominationBody,
): Promise<NominationRow> {
  const { data } = await api.post<NominationRow>(
    `/championships/${championshipId}/nominations`,
    body,
  );
  return data;
}

export async function patchNomination(
  championshipId: number,
  nominationId: number,
  body: UpdateNominationBody,
): Promise<NominationRow> {
  const { data } = await api.patch<NominationRow>(
    `/championships/${championshipId}/nominations/${nominationId}`,
    body,
  );
  return data;
}

export async function deleteNomination(
  championshipId: number,
  nominationId: number,
): Promise<void> {
  await api.delete(
    `/championships/${championshipId}/nominations/${nominationId}`,
  );
}
