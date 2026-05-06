import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import {
  deleteMembership,
  getMemberships,
  type MembershipRow,
} from '../../entities/memberships';
import { getAuthApiErrorMessage } from '../../entities/auth';
import { useAuthStore } from '../../store/authStore';
import {
  AdminPage,
  ErrorText,
  Muted,
  Subtitle,
  Table,
  TableWrap,
  Td,
  Th,
  Title,
  WideCard,
} from '../AdminUsersPage/styles';

function formatRole(m: MembershipRow): string {
  return m.role.title?.trim() || m.role.code;
}

export function MembershipsListPage() {
  const { championshipId: idParam } = useParams<{ championshipId: string }>();
  const championshipId = idParam ? Number(idParam) : NaN;
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.appRole === 'ADMIN' || user?.appRole === 'ORGANIZER';

  const championshipQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const listQuery = useQuery({
    queryKey: ['memberships', championshipId],
    queryFn: () => getMemberships(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const deleteMutation = useMutation({
    mutationFn: (membershipId: number) =>
      deleteMembership(championshipId, membershipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['memberships', championshipId],
      });
    },
  });

  const deleteError =
    deleteMutation.isError && deleteMutation.error
      ? getAuthApiErrorMessage(
          deleteMutation.error,
          'Не удалось удалить назначение.',
        )
      : null;

  if (!Number.isFinite(championshipId)) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Назначения</Title>
          <ErrorText>Некорректный адрес.</ErrorText>
          <Muted style={{ marginTop: 12 }}>
            <Link to="/championships">← К чемпионатам</Link>
          </Muted>
        </WideCard>
      </AdminPage>
    );
  }

  if (championshipQuery.isLoading || listQuery.isLoading) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Назначения</Title>
          <Muted>Загрузка…</Muted>
        </WideCard>
      </AdminPage>
    );
  }

  if (championshipQuery.isError) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Назначения</Title>
          <ErrorText>Не удалось загрузить чемпионат.</ErrorText>
          <Muted style={{ marginTop: 12 }}>
            <Link to="/championships">← К чемпионатам</Link>
          </Muted>
        </WideCard>
      </AdminPage>
    );
  }

  const ch = championshipQuery.data!;
  const archived = ch.status === 'ARCHIVED';

  const onRemove = (row: MembershipRow) => {
    if (archived) return;
    if (
      !window.confirm(
        `Снять назначение: ${row.user.surname} ${row.user.firstname} — ${formatRole(row)} — «${row.nomination.title}»?`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(row.id);
  };

  return (
    <AdminPage>
      <WideCard>
        <Title>Назначения: {ch.title}</Title>
        <Subtitle>
          Связь пользователь — номинация — роль в чемпионате. Просмотр доступен
          всем авторизованным; добавление и снятие — организатору или
          администратору.
        </Subtitle>

        {listQuery.isError ? (
          <ErrorText>
            {axios.isAxiosError(listQuery.error) &&
            listQuery.error.response?.status === 401
              ? 'Сессия истекла. Войдите снова.'
              : 'Не удалось загрузить назначения.'}
          </ErrorText>
        ) : null}

        {deleteError ? <ErrorText>{deleteError}</ErrorText> : null}

        {archived ? (
          <Muted style={{ marginTop: 8 }}>
            Чемпионат в архиве: изменение назначений недоступно.
          </Muted>
        ) : null}

        {canManage && !archived ? (
          <Muted style={{ marginTop: 8 }}>
            <Link to={`/championships/${championshipId}/memberships/new`}>
              + Добавить назначение
            </Link>
          </Muted>
        ) : null}

        <Muted style={{ marginTop: 8 }}>
          <Link to={`/championships/${championshipId}/nominations`}>
            Номинации этого чемпионата
          </Link>
        </Muted>

        {listQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Пользователь</Th>
                  <Th>Роль</Th>
                  <Th>Номинация</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <strong>
                        {row.user.surname} {row.user.firstname}
                      </strong>
                      <Muted style={{ marginTop: 4, display: 'block' }}>
                        {row.user.login}
                      </Muted>
                    </Td>
                    <Td>{formatRole(row)}</Td>
                    <Td>{row.nomination.title}</Td>
                    <Td>
                      {canManage && !archived ? (
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#b91c1c',
                            cursor: 'pointer',
                            font: 'inherit',
                            textDecoration: 'underline',
                          }}
                          disabled={deleteMutation.isPending}
                          onClick={() => onRemove(row)}
                        >
                          Снять
                        </button>
                      ) : (
                        '—'
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : null}

        {!listQuery.isLoading &&
        !listQuery.isError &&
        listQuery.data?.length === 0 ? (
          <Muted>Пока нет назначений.</Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
