export type NominationRow = {
  id: number;
  championshipId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNominationBody = {
  title: string;
  description?: string;
};

export type UpdateNominationBody = Partial<CreateNominationBody>;
