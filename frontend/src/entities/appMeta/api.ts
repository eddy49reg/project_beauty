import { api } from '../../lib/api';

export type ClientMeta = {
  workPhotoUploadEnabled: boolean;
  /** oauth = Яндекс OAuth (client + refresh в БД); none = не настроено */
  diskAuthMode: 'oauth' | 'none';
};

export async function getClientMeta(): Promise<ClientMeta> {
  const { data } = await api.get<ClientMeta>('/meta/client');
  return data;
}
