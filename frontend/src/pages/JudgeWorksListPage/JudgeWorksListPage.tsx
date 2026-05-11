import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import { getJudgeWorks } from '../../entities/judging';
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

export function JudgeWorksListPage() {
  const { championshipId: idParam } = useParams<{ championshipId: string }>();
  const championshipId = idParam ? Number(idParam) : NaN;

  const chQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const worksQuery = useQuery({
    queryKey: ['judging', 'works', championshipId],
    queryFn: () => getJudgeWorks(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  if (!Number.isFinite(championshipId)) {
    return (
      <AdminPage>
        <WideCard>
          <Title>Судейство</Title>
          <ErrorText>Некорректный адрес.</ErrorText>
        </WideCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <WideCard>
        <Title>Судейство</Title>
        <Subtitle>
          Работы, назначенные вам как судье по номинациям этого чемпионата.
        </Subtitle>

        {chQuery.isLoading || worksQuery.isLoading ? <Muted>Загрузка…</Muted> : null}
        {worksQuery.isError ? (
          <ErrorText>
            {getAuthApiErrorMessage(worksQuery.error, 'Не удалось загрузить список работ для судьи.')}
          </ErrorText>
        ) : null}

        {worksQuery.data?.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Номинация</Th>
                  <Th>Работа</Th>
                  <Th>Участник</Th>
                  <Th>Моя оценка</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {worksQuery.data.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.nomination.title}</Td>
                    <Td>{row.title}</Td>
                    <Td>
                      {row.author.surname} {row.author.firstname}
                    </Td>
                    <Td>
                      {row.myScore
                        ? `${row.myScore.score}${row.myScore.isFinal ? ' (финал)' : ' (черновик)'}`
                        : '—'}
                    </Td>
                    <Td>
                      <Link
                        to={`/championships/${championshipId}/judging/works/${row.id}`}
                      >
                        Оценить
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : null}

        {!worksQuery.isLoading &&
        !worksQuery.isError &&
        worksQuery.data?.length === 0 ? (
          <Muted>
            Для вас пока нет работ в статусе «отправлено» по назначенным
            номинациям.
          </Muted>
        ) : null}

        <Muted style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </Muted>
      </WideCard>
    </AdminPage>
  );
}
