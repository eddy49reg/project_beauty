import { useEffect } from 'react';
import type { UseFormReset } from 'react-hook-form';
import type { WorkFormValues, WorkRow } from '../../../entities/works';

export function useSyncWorkFormFromWork(
  work: WorkRow | undefined,
  reset: UseFormReset<WorkFormValues>,
) {
  useEffect(() => {
    if (!work) return;
    reset({
      nominationId: String(work.nominationId),
      title: work.title,
      description: work.description ?? '',
    });
  }, [work, reset]);
}
