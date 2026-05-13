import { useMemo } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { getAuthApiErrorMessage } from '../lib/apiError';

export function useAuthMutationServerMessage<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutation: Pick<
    UseMutationResult<TData, TError, TVariables, TContext>,
    'isError' | 'error'
  >,
  fallback: string,
): string | null {
  return useMemo(
    () =>
      mutation.isError
        ? getAuthApiErrorMessage(mutation.error, fallback)
        : null,
    [mutation.isError, mutation.error, fallback],
  );
}
