import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CSSProperties, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import { postMembership } from '../../entities/memberships';
import { getNominations } from '../../entities/nominations';
import { getRoles } from '../../entities/roles';
import { getUserDirectory } from '../../entities/userDirectory';
import { getAuthApiErrorMessage } from '../../entities/auth';
import {
  Button,
  Card,
  ErrorText,
  FooterLinks,
  Label,
  Page,
  Subtitle,
  TextLink,
  Title,
} from '../LoginPage/styles';

export function MembershipFormPage() {
  const { championshipId: chIdParam } = useParams<{
    championshipId: string;
  }>();
  const championshipId = chIdParam ? Number(chIdParam) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [nominationId, setNominationId] = useState<string>('');

  const championshipQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: Number.isFinite(championshipId),
  });

  const usersQuery = useQuery({
    queryKey: ['userDirectory'],
    queryFn: getUserDirectory,
    enabled: Number.isFinite(championshipId),
  });

  const nominationsQuery = useQuery({
    queryKey: ['nominations', championshipId],
    queryFn: () => getNominations(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      postMembership(championshipId, {
        userId: Number(userId),
        roleId: Number(roleId),
        nominationId: Number(nominationId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['memberships', championshipId],
      });
      void navigate(`/championships/${championshipId}/memberships`);
    },
  });

  const serverError = createMutation.error
    ? getAuthApiErrorMessage(
        createMutation.error,
        'Не удалось создать назначение.',
      )
    : null;

  const listHref = `/championships/${championshipId}/memberships`;

  const selectStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
  };

  if (!Number.isFinite(championshipId)) {
    return (
      <Page>
        <Card>
          <Title>Некорректный адрес</Title>
          <FooterLinks>
            <TextLink to="/championships">К чемпионатам</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (
    championshipQuery.isLoading ||
    rolesQuery.isLoading ||
    usersQuery.isLoading ||
    nominationsQuery.isLoading
  ) {
    return (
      <Page>
        <Card>
          <Title>Загрузка…</Title>
        </Card>
      </Page>
    );
  }

  if (championshipQuery.isError) {
    return (
      <Page>
        <Card>
          <Title>Назначение</Title>
          <ErrorText>Не удалось загрузить чемпионат.</ErrorText>
          <FooterLinks>
            <TextLink to="/championships">К чемпионатам</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (
    rolesQuery.isError ||
    usersQuery.isError ||
    nominationsQuery.isError
  ) {
    return (
      <Page>
        <Card>
          <Title>Назначение</Title>
          <ErrorText>Не удалось загрузить справочники.</ErrorText>
          <FooterLinks>
            <TextLink to={listHref}>К списку назначений</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (championshipQuery.data?.status === 'ARCHIVED') {
    return (
      <Page>
        <Card>
          <Title>Архив</Title>
          <Subtitle>
            Чемпионат в архиве; назначения недоступны для изменения.
          </Subtitle>
          <FooterLinks>
            <TextLink to={listHref}>К списку назначений</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  const nominations = nominationsQuery.data ?? [];
  const noNominations = nominations.length === 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !roleId || !nominationId || noNominations) return;
    createMutation.mutate();
  };

  return (
    <Page>
      <Card style={{ maxWidth: 560, width: '100%' }}>
        <Title>Новое назначение</Title>
        <Subtitle>
          Выберите пользователя, роль в чемпионате и номинацию. Дубликат
          комбинации (пользователь + номинация + роль) недопустим.
        </Subtitle>

        {noNominations ? (
          <ErrorText>
            Сначала создайте хотя бы одну номинацию у этого чемпионата.
          </ErrorText>
        ) : null}

        {serverError ? <ErrorText>{serverError}</ErrorText> : null}

        <form onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="m-user">Пользователь</Label>
            <select
              id="m-user"
              style={selectStyle}
              value={userId}
              onChange={(ev) => setUserId(ev.target.value)}
              required
            >
              <option value="">— выберите —</option>
              {(usersQuery.data ?? []).map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.surname} {u.firstname} ({u.login})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="m-role">Роль в чемпионате</Label>
            <select
              id="m-role"
              style={selectStyle}
              value={roleId}
              onChange={(ev) => setRoleId(ev.target.value)}
              required
            >
              <option value="">— выберите —</option>
              {(rolesQuery.data ?? []).map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.title?.trim() || r.code}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="m-nom">Номинация</Label>
            <select
              id="m-nom"
              style={selectStyle}
              value={nominationId}
              onChange={(ev) => setNominationId(ev.target.value)}
              required
            >
              <option value="">— выберите —</option>
              {nominations.map((n) => (
                <option key={n.id} value={String(n.id)}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={
              createMutation.isPending ||
              noNominations ||
              !userId ||
              !roleId ||
              !nominationId
            }
            style={{ marginTop: 20 }}
          >
            {createMutation.isPending ? 'Сохранение…' : 'Создать назначение'}
          </Button>
        </form>

        <FooterLinks>
          <TextLink to={listHref}>К списку назначений</TextLink>
          <TextLink to="/championships">К чемпионатам</TextLink>
        </FooterLinks>
      </Card>
    </Page>
  );
}
