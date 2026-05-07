import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  archiveChampionship,
  getChampionships,
  type ChampionshipRow,
  type ChampionshipStatus,
} from '../../entities/championships';
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

const STATUSES: ChampionshipStatus[] = [
  'DRAFT',
  'REGISTRATION',
  'JUDGING',
  'PUBLISHED',
  'ARCHIVED',
];

function statusLabel(s: ChampionshipStatus): string {
  switch (s) {
    case 'DRAFT':
      return 'Черновик';
    case 'REGISTRATION':
      return 'Регистрация';
    case 'JUDGING':
      return 'Судейство';
    case 'PUBLISHED':
      return 'Итоги опубликованы';
    case 'ARCHIVED':
      return 'Архив';
    default:
      return s;
  }
}

function formatRange(from: string, to: string): string {
  const a = new Date(from);
  const b = new Date(to);
  return `${a.toLocaleString('ru-RU')} — ${b.toLocaleString('ru-RU')}`;
}

export function ChampionshipsListPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.appRole === 'ADMIN' || user?.appRole === 'ORGANIZER';

  const listQuery = useQuery({
    queryKey: ['championships'],
    queryFn: () => getChampionships(),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveChampionship,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['championships'] });
    },
  });

  const onArchive = (row: ChampionshipRow) => {
    if (row.status === 'ARCHIVED' || row.status === 'DRAFT') return;
    if (
      !window.confirm(
        `Архивировать «${row.title}»? После архивации редактирование будет недоступно.`,
      )
    ) {
      return;
    }
    archiveMutation.mutate(row.id);
  };

  const archiveError =
    archiveMutation.isError && archiveMutation.error
      ? getAuthApiErrorMessage(
          archiveMutation.error,
          'Не удалось архивировать чемпионат.',
        )
      : null;

  return (
    <AdminPage>
      <WideCard>
        <Title>Чемпионаты</Title>
        <Subtitle>
          Список событий. Просмотр доступен всем авторизованным пользователям;
          создание и изменение — организатору или администратору.
        </Subtitle>

        {canManage ? (
          <Muted style={{ marginTop: 8 }}>
            <Link to="/championships/new">+ Создать чемпионат</Link>
          </Muted>
        ) : null}

        {listQuery.isError ? (
          <ErrorText>
            {axios.isAxiosError(listQuery.error) &&
            listQuery.error.response?.status === 401
              ? 'Сессия истекла. Войдите снова.'
              : 'Не удалось загрузить список чемпионатов.'}
          </ErrorText>
        ) : null}

        {archiveError ? <ErrorText>{archiveError}</ErrorText> : null}

        {listQuery.isLoading ? <Muted>Загрузка…</Muted> : null}

        {listQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Название</Th>
                  <Th>Статус</Th>
                  <Th>Регистрация</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <strong>{row.title}</strong>
                      {row.description ? (
                        <Muted style={{ marginTop: 4, display: 'block' }}>
                          {row.description.length > 120
                            ? `${row.description.slice(0, 120)}…`
                            : row.description}
                        </Muted>
                      ) : null}
                    </Td>
                    <Td>{statusLabel(row.status)}</Td>
                    <Td>
                      {formatRange(
                        row.registrationStartAt,
                        row.registrationEndAt,
                      )}
                    </Td>
                    <Td>
                      <Link to={`/championships/${row.id}/nominations`}>
                        Номинации
                      </Link>
                      {' · '}
                      <Link to={`/championships/${row.id}/memberships`}>
                        Назначения
                      </Link>
                      {' · '}
                      <Link to={`/championships/${row.id}/works/my`}>
                        Мои работы
                      </Link>
                      {canManage && row.status !== 'ARCHIVED' ? (
                        <>
                          {' · '}
                          <Link to={`/championships/${row.id}/edit`}>
                            Изменить
                          </Link>
                          {row.status !== 'DRAFT' ? (
                            <>
                              {' · '}
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  font: 'inherit',
                                  textDecoration: 'underline',
                                }}
                                disabled={archiveMutation.isPending}
                                onClick={() => onArchive(row)}
                              >
                                В архив
                              </button>
                            </>
                          ) : null}
                        </>
                      ) : null}
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
          <Muted>Пока нет чемпионатов.</Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          Статусы в системе:{' '}
          {STATUSES.map((s) => statusLabel(s)).join(', ')}.
        </Muted>

        <Muted style={{ marginTop: 12 }}>
          <Link to="/">← На главную</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
