export function parseWorkRouteIds(params: {
  championshipId?: string;
  workId?: string;
}): { championshipId: number; workId: number; isEdit: boolean } {
  const championshipId = params.championshipId
    ? Number(params.championshipId)
    : Number.NaN;
  const workId = params.workId ? Number(params.workId) : Number.NaN;
  const isEdit = Number.isFinite(workId);
  return { championshipId, workId, isEdit };
}
