import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getAuthApiErrorMessage,
  hasGlobalChampionshipAdminAccess,
  type UserAppRole,
} from '../../entities/auth';
import {
  archiveChampionship,
  getChampionships,
  type ChampionshipRow,
  type ChampionshipStatus,
} from '../../entities/championships';
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

function listActionsForRow(
  row: ChampionshipRow,
  appRole: UserAppRole,
): {
  applyOnly: boolean;
  showNominations: boolean;
  showMemberships: boolean;
  showMyWorks: boolean;
  showJudging: boolean;
  showResults: boolean;
  showEdit: boolean;
  showArchive: boolean;
} {
  const codes = new Set(row.myRoleCodes ?? []);
  const hasMembership = codes.size > 0;
  const canApply = Boolean(row.canApplyAsParticipant);

  const isAdmin = appRole === 'ADMIN';
  const isGlobalOrg = appRole === 'ORGANIZER';
  const isChampOrg = codes.has('organizer');
  const isParticipant = codes.has('participant');
  const isJudge = codes.has('judge');

  const canManageRow = isAdmin || isGlobalOrg || isChampOrg;

  if (!hasMembership && canApply && !isAdmin && !isGlobalOrg) {
    return {
      applyOnly: true,
      showNominations: false,
      showMemberships: false,
      showMyWorks: false,
      showJudging: false,
      showResults: false,
      showEdit: false,
      showArchive: false,
    };
  }

  const showNominations = canManageRow || isParticipant;
  const showMemberships = canManageRow;
  const showMyWorks =
    isParticipant &&
    !isChampOrg &&
    appRole !== 'ADMIN' &&
    appRole !== 'ORGANIZER';
  const showJudging = isJudge || canManageRow;
  const showResults = canManageRow;
  const showEdit = canManageRow && row.status !== 'ARCHIVED';
  const showArchive =
    canManageRow &&
    row.status !== 'ARCHIVED' &&
    row.status !== 'DRAFT';

  return {
    applyOnly: false,
    showNominations,
    showMemberships,
    showMyWorks,
    showJudging,
    showResults,
    showEdit,
    showArchive,
  };
}

function ChampionshipActionsCell({
  row,
  appRole,
  archivePending,
  onArchive,
}: {
  row: ChampionshipRow;
  appRole: UserAppRole;
  archivePending: boolean;
  onArchive: (row: ChampionshipRow) => void;
}) {
  const ui = listActionsForRow(row, appRole);

  if (ui.applyOnly) {
    return (
      <Link to={`/championships/${row.id}/apply`}>
        Подать заявку на участие
      </Link>
    );
  }

  const parts: ReactNode[] = [];
  if (ui.showNominations) {
    parts.push(
      <Link key="nom" to={`/championships/${row.id}/nominations`}>
        Номинации
      </Link>,
    );
  }
  if (ui.showMemberships) {
    parts.push(
      <Link key="mem" to={`/championships/${row.id}/memberships`}>
        Назначения
      </Link>,
    );
  }
  if (ui.showMyWorks) {
    parts.push(
      <Link key="works" to={`/championships/${row.id}/works/my`}>
        Мои работы
      </Link>,
    );
  }
  if (ui.showJudging) {
    parts.push(
      <Link key="jud" to={`/championships/${row.id}/judging/works`}>
        Судейство
      </Link>,
    );
  }
  if (ui.showResults) {
    parts.push(
      <Link key="res" to={`/championships/${row.id}/results`}>
        Результаты
      </Link>,
    );
  }
  if (ui.showEdit) {
    parts.push(
      <Link key="edit" to={`/championships/${row.id}/edit`}>
        Изменить
      </Link>,
    );
  }
  if (ui.showArchive) {
    parts.push(
      <button
        key="arch"
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
        disabled={archivePending}
        onClick={() => onArchive(row)}
      >
        В архив
      </button>,
    );
  }

  if (parts.length === 0) {
    return <Muted>—</Muted>;
  }

  return (
    <>
      {parts.map((node, i) => (
        <Fragment key={`a-${i}`}>
          {i > 0 ? ' · ' : null}
          {node}
        </Fragment>
      ))}
    </>
  );
}

export function ChampionshipsListPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const appRole: UserAppRole = user?.appRole ?? 'USER';
  const canCreateChampionship = hasGlobalChampionshipAdminAccess(user);

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
          Список чемпионатов с учётом ваших ролей: черновики видны только
          администратору и организатору чемпионата; действия в строке зависят от
          роли в конкретном событии.
        </Subtitle>

        {canCreateChampionship ? (
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
                      <ChampionshipActionsCell
                        row={row}
                        appRole={appRole}
                        archivePending={archiveMutation.isPending}
                        onArchive={onArchive}
                      />
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
