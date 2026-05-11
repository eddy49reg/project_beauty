import { api } from '../../lib/api';
import type { ChampionshipResults } from './types';

export async function getChampionshipResults(
  championshipId: number,
): Promise<ChampionshipResults> {
  const { data } = await api.get<ChampionshipResults>(
    `/championships/${championshipId}/results`,
  );
  return data;
}
