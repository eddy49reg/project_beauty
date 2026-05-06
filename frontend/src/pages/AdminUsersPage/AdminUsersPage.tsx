import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminUsers,
  patchUserAppRole,
  type AdminUserRow,
} from '../../entities/admin';
import { getAuthApiErrorMessage, type UserAppRole } from '../../entities/auth';
import { useAuthStore } from '../../store/authStore';
import {
  AdminPage,
  ErrorText,
  Muted,
  RoleSelect,
  Subtitle,
  Table,
  TableWrap,
  Td,
  Th,
  Title,
  WideCard,
} from './styles';

const ROLES: UserAppRole[] = ['USER', 'ORGANIZER', 'ADMIN'];

function roleLabel(r: UserAppRole): string {
  switch (r) {
    case 'USER':
      return 'Пользователь';
    case 'ORGANIZER':
      return 'Организатор';
    case 'ADMIN':
      return 'Админ';
    default:
      return r;
  }
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [rowError, setRowError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAdminUsers,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, appRole }: { id: number; appRole: UserAppRole }) =>
      patchUserAppRole(id, appRole),
    onSuccess: (updated: AdminUserRow) => {
      setRowError(null);
      queryClient.setQueryData<AdminUserRow[]>(['admin', 'users'], (prev) =>
        prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev,
      );
      const token = useAuthStore.getState().accessToken;
      if (token && currentUser?.id === updated.id) {
        useAuthStore.getState().setSession(token, {
          ...currentUser,
          appRole: updated.appRole,
        });
      }
    },
    onError: (err: unknown) => {
      setRowError(
        getAuthApiErrorMessage(err, 'Не удалось обновить роль') ?? 'Ошибка',
      );
    },
  });

  const onRoleChange = (row: AdminUserRow, appRole: UserAppRole) => {
    if (appRole === row.appRole) return;
    setRowError(null);
    patchMutation.mutate({ id: row.id, appRole });
  };

  return (
    <AdminPage>
      <WideCard>
        <Title>Пользователи</Title>
        <Subtitle>
          Только администратор видит этот раздел. Здесь можно выдать роль
          организатора (или админа) зарегистрированным пользователям.
        </Subtitle>

        {usersQuery.isError ? (
          <ErrorText>
            {axios.isAxiosError(usersQuery.error) &&
            usersQuery.error.response?.status === 403
              ? 'Нет доступа (нужна роль администратора). Выйдите и войдите под учёткой admin, если вы только что применили миграцию.'
              : 'Не удалось загрузить список.'}
          </ErrorText>
        ) : null}

        {rowError ? <ErrorText>{rowError}</ErrorText> : null}

        {usersQuery.isLoading ? <Muted>Загрузка…</Muted> : null}

        {usersQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Логин</Th>
                  <Th>Имя</Th>
                  <Th>Телефон</Th>
                  <Th>Telegram</Th>
                  <Th>Роль в приложении</Th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.login}</Td>
                    <Td>
                      {row.firstname} {row.surname}
                    </Td>
                    <Td>{row.phone}</Td>
                    <Td>{row.tg ?? '—'}</Td>
                    <Td>
                      <RoleSelect
                        aria-label={`Роль для ${row.login}`}
                        value={row.appRole}
                        disabled={patchMutation.isPending}
                        onChange={(e) =>
                          onRoleChange(row, e.target.value as UserAppRole)
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </RoleSelect>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : null}

        {!usersQuery.isLoading &&
        !usersQuery.isError &&
        usersQuery.data?.length === 0 ? (
          <Muted>Пользователей пока нет.</Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          <Link to="/">← На главную</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
