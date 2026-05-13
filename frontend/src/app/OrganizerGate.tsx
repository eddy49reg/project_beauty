import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { hasGlobalChampionshipAdminAccess } from '../entities/auth';
import { useAuthStore } from '../store/authStore';

type OrganizerGateProps = {
  children: ReactNode;
};

export function OrganizerGate({ children }: OrganizerGateProps) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!hasGlobalChampionshipAdminAccess(user)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
