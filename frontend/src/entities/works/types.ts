export type WorkStatus = 'DRAFT' | 'SUBMITTED' | 'OVERDUE';

export type WorkRow = {
  id: number;
  championshipId: number;
  nominationId: number;
  authorId: number;
  title: string;
  description: string | null;
  status: WorkStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  nomination: {
    id: number;
    title: string;
  };
};

export type CreateWorkBody = {
  nominationId: number;
  title: string;
  description?: string;
};

export type UpdateWorkBody = {
  title?: string;
  description?: string;
};
