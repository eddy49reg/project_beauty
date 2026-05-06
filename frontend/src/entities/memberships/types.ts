export type MembershipRow = {
  id: number;
  userId: number;
  championshipId: number;
  roleId: number;
  nominationId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    login: string;
    firstname: string;
    surname: string;
  };
  role: { id: number; code: string; title: string | null };
  nomination: { id: number; title: string };
};

export type CreateMembershipBody = {
  userId: number;
  roleId: number;
  nominationId: number;
};
