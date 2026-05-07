import { api } from '../../lib/api';
import type { CreateWorkBody, UpdateWorkBody, WorkRow } from './types';

export async function getMyWorks(championshipId: number): Promise<WorkRow[]> {
  const { data } = await api.get<WorkRow[]>(
    `/championships/${championshipId}/works/my`,
  );
  return data;
}

export async function getMyWork(
  championshipId: number,
  workId: number,
): Promise<WorkRow> {
  const { data } = await api.get<WorkRow>(
    `/championships/${championshipId}/works/my/${workId}`,
  );
  return data;
}

export async function postWork(
  championshipId: number,
  body: CreateWorkBody,
): Promise<WorkRow> {
  const { data } = await api.post<WorkRow>(
    `/championships/${championshipId}/works`,
    body,
  );
  return data;
}

export async function patchWork(
  championshipId: number,
  workId: number,
  body: UpdateWorkBody,
): Promise<WorkRow> {
  const { data } = await api.patch<WorkRow>(
    `/championships/${championshipId}/works/${workId}`,
    body,
  );
  return data;
}

export async function submitWork(
  championshipId: number,
  workId: number,
): Promise<WorkRow> {
  const { data } = await api.post<WorkRow>(
    `/championships/${championshipId}/works/${workId}/submit`,
  );
  return data;
}

export async function deleteWork(
  championshipId: number,
  workId: number,
): Promise<void> {
  await api.delete(`/championships/${championshipId}/works/${workId}`);
}
