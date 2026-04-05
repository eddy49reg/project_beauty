import { useMutation } from '@tanstack/react-query';
import { postRegister } from '../api';
import type { RegisterBody, RegisterResponse } from '../types';

export function useRegisterMutation(options?: {
  onSuccess?: (data: RegisterResponse) => void;
}) {
  return useMutation({
    mutationFn: (body: RegisterBody) => postRegister(body),
    onSuccess: options?.onSuccess,
  });
}
