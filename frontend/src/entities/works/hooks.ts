import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteWork,
  deleteWorkAttachment,
  getMyWork,
  patchWork,
  postWork,
  postWorkAttachment,
  postWorkWithAttachments,
  submitWork,
} from './api';
import type { WorkFormValues, WorkRow } from './types';

function invalidateMyWorks(
  queryClient: QueryClient,
  championshipId: number,
) {
  return queryClient.invalidateQueries({
    queryKey: ['works', 'my', championshipId],
  });
}

function invalidateWork(
  queryClient: QueryClient,
  championshipId: number,
  workId: number,
) {
  return queryClient.invalidateQueries({
    queryKey: ['work', championshipId, workId],
  });
}

export function useMyWorkQuery(
  championshipId: number,
  workId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['work', championshipId, workId],
    queryFn: () => getMyWork(championshipId, workId),
    enabled:
      enabled && Number.isFinite(championshipId) && Number.isFinite(workId),
  });
}

export function useCreateWorkMutation(
  championshipId: number,
  onPersistSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (v: WorkFormValues) =>
      postWork(championshipId, {
        nominationId: Number(v.nominationId),
        title: v.title.trim(),
        description: v.description.trim() || undefined,
      }),
    onSuccess: async (created: WorkRow) => {
      onPersistSuccess?.();
      await invalidateMyWorks(queryClient, championshipId);
      navigate(
        `/championships/${championshipId}/works/${created.id}/edit`,
      );
    },
  });
}

export function useCreateWorkWithAttachmentsMutation(
  championshipId: number,
  onPersistSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation<
    WorkRow,
    Error,
    { v: WorkFormValues; files: File[] }
  >({
    mutationFn: ({ v, files }) =>
      postWorkWithAttachments(
        championshipId,
        {
          nominationId: Number(v.nominationId),
          title: v.title.trim(),
          description: v.description.trim() || undefined,
        },
        files,
      ),
    onSuccess: async (created) => {
      onPersistSuccess?.();
      await invalidateMyWorks(queryClient, championshipId);
      navigate(
        `/championships/${championshipId}/works/${created.id}/edit`,
      );
    },
  });
}

export function useUpdateWorkMutation(
  championshipId: number,
  workId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: WorkFormValues) =>
      patchWork(championshipId, workId, {
        title: v.title.trim(),
        description: v.description.trim() || undefined,
      }),
    onSuccess: async () => {
      await invalidateMyWorks(queryClient, championshipId);
      await invalidateWork(queryClient, championshipId, workId);
    },
  });
}

export function useSubmitWorkMutation(championshipId: number, workId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => submitWork(championshipId, workId),
    onSuccess: async () => {
      await invalidateMyWorks(queryClient, championshipId);
      navigate(`/championships/${championshipId}/works/my`);
    },
  });
}

export function useDeleteWorkMutation(championshipId: number, workId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => deleteWork(championshipId, workId),
    onSuccess: async () => {
      await invalidateMyWorks(queryClient, championshipId);
      navigate(`/championships/${championshipId}/works/my`);
    },
  });
}

export function useUploadWorkAttachmentMutation(
  championshipId: number,
  workId: number,
  fileInputRef: RefObject<HTMLInputElement | null>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      postWorkAttachment(championshipId, workId, file),
    onSuccess: async () => {
      await invalidateWork(queryClient, championshipId, workId);
      await invalidateMyWorks(queryClient, championshipId);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });
}

export function useDeleteWorkAttachmentMutation(
  championshipId: number,
  workId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      deleteWorkAttachment(championshipId, workId, attachmentId),
    onSuccess: async () => {
      await invalidateWork(queryClient, championshipId, workId);
      await invalidateMyWorks(queryClient, championshipId);
    },
  });
}
