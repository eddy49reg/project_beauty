import { Navigate } from 'react-router-dom';
import { ChampionshipsListPage } from '../pages/ChampionshipsListPage/ChampionshipsListPage';
import { useAuthStore } from '../store/authStore';

export function ChampionshipsListGate() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <ChampionshipsListPage />;
}
