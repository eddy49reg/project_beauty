export const CHAMPIONSHIP_STATUSES = [
  'DRAFT',
  'REGISTRATION',
  'JUDGING',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type ChampionshipStatus = (typeof CHAMPIONSHIP_STATUSES)[number];
