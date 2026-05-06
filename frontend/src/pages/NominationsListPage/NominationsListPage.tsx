import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import { getNominations } from '../../entities/nominations';
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

export function NominationsListPage() {
  const { championshipId: idParam } = useParams<{ championshipId: string }>();
  const championshipId = idParam ? Number(idParam) : NaN;
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.appRole === 'ADMIN' || user?.appRole === 'ORGANIZER';

  const championshipQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const nominationsQuery = useQuery({
    queryKey: ['nominations', championshipId],
    queryFn: () => getNominations(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  if (!Number.isFinite(championshipId)) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Номинации</Title>
          <ErrorText>Некорректный адрес.</ErrorText>
          <Muted style={{ marginTop: 12 }}>
            <Link to="/championships">← К чемпионатам</Link>
          </Muted>
        </WideCard>
      </AdminPage>
    );
  }

  if (championshipQuery.isLoading || nominationsQuery.isLoading) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Номинации</Title>
          <Muted>Загрузка…</Muted>
        </WideCard>
      </AdminPage>
    );
  }

  if (championshipQuery.isError) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Номинации</Title>
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

  return (
    <AdminPage>
      <WideCard>
        <Title>Номинации: {ch.title}</Title>
        <Subtitle>
          Список номинаций чемпионата. Просмотр — всем авторизованным;
          создание и правки — организатору или администратору.
        </Subtitle>

        {nominationsQuery.isError ? (
          <ErrorText>
            {axios.isAxiosError(nominationsQuery.error) &&
            nominationsQuery.error.response?.status === 401
              ? 'Сессия истекла. Войдите снова.'
              : 'Не удалось загрузить номинации.'}
          </ErrorText>
        ) : null}

        {archived ? (
          <Muted style={{ marginTop: 8 }}>
            Чемпионат в архиве: добавление и изменение номинаций недоступно.
          </Muted>
        ) : null}

        {canManage && !archived ? (
          <Muted style={{ marginTop: 8 }}>
            <Link to={`/championships/${championshipId}/nominations/new`}>
              + Добавить номинацию
            </Link>
          </Muted>
        ) : null}

        {nominationsQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Название</Th>
                  <Th>Описание</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {nominationsQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <strong>{row.title}</strong>
                    </Td>
                    <Td>
                      {row.description ? (
                        <Muted>
                          {row.description.length > 160
                            ? `${row.description.slice(0, 160)}…`
                            : row.description}
                        </Muted>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      {canManage && !archived ? (
                        <Link
                          to={`/championships/${championshipId}/nominations/${row.id}/edit`}
                        >
                          Изменить
                        </Link>
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

        {!nominationsQuery.isLoading &&
        !nominationsQuery.isError &&
        nominationsQuery.data?.length === 0 ? (
          <Muted>Пока нет номинаций.</Muted>
        ) : null}

        <Muted style={{ marginTop: 16 }}>
          <Link to={`/championships/${championshipId}/memberships`}>
            Назначения участников
          </Link>
        </Muted>

        <Muted style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
