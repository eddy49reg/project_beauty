import { api } from '../../lib/api';
import type { CreateWorkBody, UpdateWorkBody, WorkAttachmentRow, WorkRow } from './types';

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

/** Создание черновика и загрузка изображений одним запросом (сервер откатывает при ошибке). */
export async function postWorkWithAttachments(
  championshipId: number,
  body: CreateWorkBody,
  files: File[],
): Promise<WorkRow> {
  const form = new FormData();
  form.append('nominationId', String(body.nominationId));
  form.append('title', body.title);
  if (body.description !== undefined && body.description !== '') {
    form.append('description', body.description);
  }
  for (const f of files) {
    form.append('files', f);
  }
  const { data } = await api.post<WorkRow>(
    `/championships/${championshipId}/works/with-attachments`,
    form,
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

export async function postWorkAttachment(
  championshipId: number,
  workId: number,
  file: File,
): Promise<WorkAttachmentRow> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<WorkAttachmentRow>(
    `/championships/${championshipId}/works/${workId}/attachments`,
    form,
  );
  return data;
}

export async function deleteWorkAttachment(
  championshipId: number,
  workId: number,
  attachmentId: number,
): Promise<void> {
  await api.delete(
    `/championships/${championshipId}/works/${workId}/attachments/${attachmentId}`,
  );
}
