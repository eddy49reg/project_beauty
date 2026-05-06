import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type OrganizerGateProps = {
  children: ReactNode;
};

export function OrganizerGate({ children }: OrganizerGateProps) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.appRole !== 'ADMIN' && user.appRole !== 'ORGANIZER') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
