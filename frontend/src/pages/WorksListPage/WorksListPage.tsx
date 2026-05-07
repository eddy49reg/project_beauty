import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import { getAuthApiErrorMessage } from '../../entities/auth';
import { getMyWorks, type WorkStatus } from '../../entities/works';
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

function statusLabel(s: WorkStatus): string {
  switch (s) {
    case 'DRAFT':
      return 'Черновик';
    case 'SUBMITTED':
      return 'Отправлено';
    case 'OVERDUE':
      return 'Просрочено';
    default:
      return s;
  }
}

export function WorksListPage() {
  const { championshipId: idParam } = useParams<{ championshipId: string }>();
  const championshipId = idParam ? Number(idParam) : NaN;
  const chQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const worksQuery = useQuery({
    queryKey: ['works', 'my', championshipId],
    queryFn: () => getMyWorks(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  if (!Number.isFinite(championshipId)) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Мои работы</Title>
          <ErrorText>Некорректный адрес.</ErrorText>
        </WideCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <WideCard>
        <Title>Мои работы</Title>
        <Subtitle>
          Подача работ участником по номинациям выбранного чемпионата.
          Редактирование и отправка доступны до конца регистрации.
        </Subtitle>

        {chQuery.isLoading || worksQuery.isLoading ? <Muted>Загрузка…</Muted> : null}
        {worksQuery.isError ? (
          <ErrorText>
            {getAuthApiErrorMessage(worksQuery.error, 'Не удалось загрузить работы.')}
          </ErrorText>
        ) : null}
        {chQuery.isError ? (
          <ErrorText>
            {axios.isAxiosError(chQuery.error)
              ? 'Не удалось загрузить чемпионат.'
              : 'Ошибка загрузки чемпионата.'}
          </ErrorText>
        ) : null}

        {Number.isFinite(championshipId) ? (
          <Muted style={{ marginTop: 8 }}>
            <Link to={`/championships/${championshipId}/works/new`}>
              + Добавить работу
            </Link>
          </Muted>
        ) : null}

        {worksQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Номинация</Th>
                  <Th>Название</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {worksQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.nomination.title}</Td>
                    <Td>{row.title}</Td>
                    <Td>{statusLabel(row.status)}</Td>
                    <Td>
                      <Link to={`/championships/${championshipId}/works/${row.id}/edit`}>
                        Открыть
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : null}

        {!worksQuery.isLoading && !worksQuery.isError && worksQuery.data?.length === 0 ? (
          <Muted>Пока нет работ.</Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
