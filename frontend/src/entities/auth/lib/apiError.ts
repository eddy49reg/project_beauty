import axios from 'axios';

export function getAuthApiErrorMessage(
  error: unknown,
  fallback: string,
): string | null {
  if (!error) return null;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message: unknown }).message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
  }
  return fallback;
}
