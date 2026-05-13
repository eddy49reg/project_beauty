export type JudgeScoreRow = {
  id: number;
  score: number;
  comment: string | null;
  isFinal: boolean;
  finalizedAt: string | null;
  updatedAt: string;
};

export type JudgeWorkRow = {
  id: number;
  championshipId: number;
  nominationId: number;
  authorId: number;
  title: string;
  description: string | null;
  status: 'SUBMITTED' | 'DRAFT' | 'OVERDUE';
  submittedAt: string | null;
  nomination: { id: number; title: string };
  author: { id: number; login: string; firstname: string; surname: string };
  myScore: JudgeScoreRow | null;
  attachments: {
    id: number;
    viewUrl: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }[];
};

export type UpsertJudgeScoreBody = {
  score: number;
  comment?: string;
};
