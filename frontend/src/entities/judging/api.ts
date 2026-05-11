import { api } from '../../lib/api';
import type {
  JudgeWorkRow,
  UpsertJudgeScoreBody,
} from './types';

export async function getJudgeWorks(championshipId: number): Promise<JudgeWorkRow[]> {
  const { data } = await api.get<JudgeWorkRow[]>(
    `/championships/${championshipId}/judging/works`,
  );
  return data;
}

export async function getJudgeWork(
  championshipId: number,
  workId: number,
): Promise<JudgeWorkRow> {
  const { data } = await api.get<JudgeWorkRow>(
    `/championships/${championshipId}/judging/works/${workId}`,
  );
  return data;
}

export async function putJudgeScore(
  championshipId: number,
  workId: number,
  body: UpsertJudgeScoreBody,
) {
  const { data } = await api.put(
    `/championships/${championshipId}/judging/works/${workId}/score`,
    body,
  );
  return data;
}

export async function finalizeJudgeScore(
  championshipId: number,
  workId: number,
) {
  const { data } = await api.post(
    `/championships/${championshipId}/judging/works/${workId}/score/finalize`,
  );
  return data;
}
