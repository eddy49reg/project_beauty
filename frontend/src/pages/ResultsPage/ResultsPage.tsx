import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getChampionshipResults } from '../../entities/results';
import { getAuthApiErrorMessage } from '../../entities/auth';
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

function scoreCell(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

export function ResultsPage() {
  const { championshipId: idParam } = useParams<{ championshipId: string }>();
  const championshipId = idParam ? Number(idParam) : NaN;
  const query = useQuery({
    queryKey: ['results', championshipId],
    queryFn: () => getChampionshipResults(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  if (!Number.isFinite(championshipId)) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Результаты</Title>
          <ErrorText>Некорректный адрес.</ErrorText>
        </WideCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <WideCard>
        <Title>Результаты чемпионата</Title>
        <Subtitle>
          Рейтинг строится по среднему значению финализированных оценок судей.
        </Subtitle>

        {query.isLoading ? <Muted>Загрузка…</Muted> : null}
        {query.isError ? (
          <ErrorText>
            {getAuthApiErrorMessage(query.error, 'Не удалось загрузить результаты.')}
          </ErrorText>
        ) : null}

        {query.data ? (
          <Muted style={{ marginTop: 4 }}>
            Чемпионат: <strong>{query.data.championship.title}</strong> (
            {query.data.championship.status})
          </Muted>
        ) : null}

        {query.data?.nominations.map((nom) => (
          <div key={nom.nominationId} style={{ marginTop: 20 }}>
            <Subtitle style={{ marginBottom: 8 }}>
              Номинация: <strong>{nom.nominationTitle}</strong>
            </Subtitle>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Место</Th>
                    <Th>Участник</Th>
                    <Th>Работа</Th>
                    <Th>Средний балл</Th>
                    <Th>Финальных оценок</Th>
                  </tr>
                </thead>
                <tbody>
                  {nom.rows.map((row) => (
                    <tr key={row.workId}>
                      <Td>{row.rank ?? '—'}</Td>
                      <Td>{row.authorName}</Td>
                      <Td>{row.workTitle}</Td>
                      <Td>{scoreCell(row.averageScore)}</Td>
                      <Td>{row.scoresCount}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        ))}

        {query.data && query.data.nominations.length === 0 ? (
          <Muted>Пока нет результатов по номинациям.</Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
