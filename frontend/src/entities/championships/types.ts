/** Совпадает с Prisma `ChampionshipStatus`. */
export type ChampionshipStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'JUDGING'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ChampionshipRow = {
  id: number;
  title: string;
  description: string | null;
  status: ChampionshipStatus;
  registrationStartAt: string;
  registrationEndAt: string;
  judgingStartAt: string | null;
  judgingEndAt: string | null;
  resultPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Коды ролей в этом чемпионате (membership), сортированный список с бэкенда. */
  myRoleCodes?: string[];
  /** Можно подать заявку участника (см. правила на бэкенде). */
  canApplyAsParticipant?: boolean;
};

export type CreateChampionshipBody = {
  title: string;
  description?: string;
  status?: ChampionshipStatus;
  registrationStartAt: string;
  registrationEndAt: string;
  judgingStartAt?: string;
  judgingEndAt?: string;
  resultPublishedAt?: string;
};

export type UpdateChampionshipBody = Partial<CreateChampionshipBody>;

/** Ответ GET /championships/:id/registration-contact */
export type ChampionshipRegistrationContact = {
  organizerTelegram: string | null;
  organizerDisplayName: string | null;
};
