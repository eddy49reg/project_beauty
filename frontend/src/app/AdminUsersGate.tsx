import { Navigate } from 'react-router-dom';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { useAuthStore } from '../store/authStore';

export function AdminUsersGate() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.appRole !== 'ADMIN') return <Navigate to="/" replace />;
  return <AdminUsersPage />;
}
