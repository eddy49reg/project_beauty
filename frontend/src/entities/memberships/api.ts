import { api } from '../../lib/api';
import type { CreateMembershipBody, MembershipRow } from './types';

export async function getMemberships(
  championshipId: number,
): Promise<MembershipRow[]> {
  const { data } = await api.get<MembershipRow[]>(
    `/championships/${championshipId}/memberships`,
  );
  return data;
}

export async function postMembership(
  championshipId: number,
  body: CreateMembershipBody,
): Promise<MembershipRow> {
  const { data } = await api.post<MembershipRow>(
    `/championships/${championshipId}/memberships`,
    body,
  );
  return data;
}

export async function deleteMembership(
  championshipId: number,
  membershipId: number,
): Promise<void> {
  await api.delete(
    `/championships/${championshipId}/memberships/${membershipId}`,
  );
}
