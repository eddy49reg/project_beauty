import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import {
  deleteNomination,
  getNomination,
  patchNomination,
  postNomination,
} from '../../entities/nominations';
import { getAuthApiErrorMessage } from '../../entities/auth';
import {
  Button,
  Card,
  ErrorText,
  FieldError,
  FooterLinks,
  Input,
  Label,
  Page,
  Subtitle,
  TextLink,
  Title,
} from '../../shared/ui';

type FormValues = {
  title: string;
  description: string;
};

export function NominationFormPage() {
  const { championshipId: chIdParam, nominationId: nomIdParam } = useParams<{
    championshipId: string;
    nominationId: string;
  }>();
  const championshipId = chIdParam ? Number(chIdParam) : NaN;
  const nominationId = nomIdParam ? Number(nomIdParam) : NaN;
  const isEdit = Number.isFinite(nominationId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const championshipQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const nominationQuery = useQuery({
    queryKey: ['nomination', championshipId, nominationId],
    queryFn: () => getNomination(championshipId, nominationId),
    enabled: isEdit && Number.isFinite(championshipId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    const row = nominationQuery.data;
    if (!row) return;
    reset({
      title: row.title,
      description: row.description ?? '',
    });
  }, [nominationQuery.data, reset]);

  const createMutation = useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      postNomination(championshipId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['nominations', championshipId],
      });
      void navigate(`/championships/${championshipId}/nominations`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      patchNomination(championshipId, nominationId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['nominations', championshipId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['nomination', championshipId, nominationId],
      });
      void navigate(`/championships/${championshipId}/nominations`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNomination(championshipId, nominationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['nominations', championshipId],
      });
      void navigate(`/championships/${championshipId}/nominations`);
    },
  });

  const serverError = (() => {
    const err =
      createMutation.error ?? updateMutation.error ?? deleteMutation.error;
    if (!err) return null;
    return getAuthApiErrorMessage(err, 'Операция с номинацией не удалась.');
  })();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const listHref = `/championships/${championshipId}/nominations`;

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

  if (isEdit && !Number.isFinite(nominationId)) {
    return (
      <Page>
        <Card>
          <Title>Некорректный адрес</Title>
          <FooterLinks>
            <TextLink to={listHref}>К номинациям</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (championshipQuery.isLoading || (isEdit && nominationQuery.isLoading)) {
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
          <Title>Номинация</Title>
          <ErrorText>Не удалось загрузить чемпионат.</ErrorText>
          <FooterLinks>
            <TextLink to="/championships">К чемпионатам</TextLink>
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
            Чемпионат в архиве; номинации недоступны для изменения.
          </Subtitle>
          <FooterLinks>
            <TextLink to={listHref}>К списку номинаций</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (isEdit && nominationQuery.isError) {
    return (
      <Page>
        <Card>
          <Title>Номинация</Title>
          <ErrorText>Не удалось загрузить данные.</ErrorText>
          <FooterLinks>
            <TextLink to={listHref}>К списку</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  const onSubmit = (data: FormValues) => {
    const title = data.title.trim();
    const description = data.description.trim();
    const body = {
      title,
      description: description || undefined,
    };
    if (isEdit) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  };

  const onDelete = () => {
    if (
      !window.confirm(
        'Удалить номинацию? Если есть назначения участников, сервер отклонит удаление.',
      )
    ) {
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <Page>
      <Card style={{ maxWidth: 560, width: '100%' }}>
        <Title>{isEdit ? 'Редактирование номинации' : 'Новая номинация'}</Title>
        <Subtitle>
          Название уникально в рамках чемпионата. Описание необязательно.
        </Subtitle>

        {serverError ? <ErrorText>{serverError}</ErrorText> : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="nom-title">Название</Label>
            <Input
              id="nom-title"
              aria-invalid={errors.title ? true : undefined}
              {...register('title', { required: 'Введите название' })}
            />
            {errors.title?.message ? (
              <FieldError role="alert">{errors.title.message}</FieldError>
            ) : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="nom-desc">Описание (необязательно)</Label>
            <textarea
              id="nom-desc"
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                marginBottom: 16,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: '1rem',
                minHeight: 96,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              {...register('description')}
            />
          </div>

          <Button type="submit" disabled={isPending} style={{ marginTop: 20 }}>
            {isPending && !deleteMutation.isPending
              ? 'Сохранение…'
              : isEdit
                ? 'Сохранить'
                : 'Создать'}
          </Button>
        </form>

        {isEdit ? (
          <div style={{ marginTop: 24 }}>
            <Button
              type="button"
              disabled={isPending}
              onClick={onDelete}
              style={{
                background: '#b91c1c',
              }}
            >
              {deleteMutation.isPending ? 'Удаление…' : 'Удалить номинацию'}
            </Button>
          </div>
        ) : null}

        <FooterLinks>
          <TextLink to={listHref}>К списку номинаций</TextLink>
          <TextLink to="/championships">К чемпионатам</TextLink>
        </FooterLinks>
      </Card>
    </Page>
  );
}
