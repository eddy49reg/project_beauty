import { useMutation } from '@tanstack/react-query';
import { postLogin } from '../api';
import type { LoginBody, LoginResponse } from '../types';

export function useLoginMutation(options?: {
  onSuccess?: (data: LoginResponse) => void;
}) {
  return useMutation({
    mutationFn: (body: LoginBody) => postLogin(body),
    onSuccess: options?.onSuccess,
  });
}
