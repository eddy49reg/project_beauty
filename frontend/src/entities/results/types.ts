import type { ChampionshipStatus } from '../championships';

export type ResultRow = {
  workId: number;
  workTitle: string;
  authorId: number;
  authorName: string;
  authorLogin: string;
  submittedAt: string | null;
  scoresCount: number;
  averageScore: number | null;
  rank: number | null;
};

export type NominationResults = {
  nominationId: number;
  nominationTitle: string;
  rows: ResultRow[];
};

export type ChampionshipResults = {
  championship: {
    id: number;
    title: string;
    status: ChampionshipStatus;
  };
  nominations: NominationResults[];
};
