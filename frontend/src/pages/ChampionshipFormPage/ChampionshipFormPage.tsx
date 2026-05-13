import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getChampionship,
  patchChampionship,
  postChampionship,
  type ChampionshipStatus,
} from '../../entities/championships';
import { getAuthApiErrorMessage } from '../../entities/auth';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../lib/datetimeLocal';
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

/** В форме создания/редактирования статус ARCHIVED не выбирается — только через «В архив». */
const FORM_STATUSES: ChampionshipStatus[] = [
  'DRAFT',
  'REGISTRATION',
  'JUDGING',
  'PUBLISHED',
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

type FormValues = {
  title: string;
  description: string;
  status: ChampionshipStatus;
  registrationStartAt: string;
  registrationEndAt: string;
  judgingStartAt: string;
  judgingEndAt: string;
  resultPublishedAt: string;
};

function defaultCreateValues(): FormValues {
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    status: 'DRAFT',
    registrationStartAt: toDatetimeLocalValue(now.toISOString()),
    registrationEndAt: toDatetimeLocalValue(week.toISOString()),
    judgingStartAt: '',
    judgingEndAt: '',
    resultPublishedAt: '',
  };
}

export function ChampionshipFormPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const isEdit = idParam !== undefined;
  const championshipId = idParam ? Number(idParam) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: isEdit && Number.isFinite(championshipId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaultCreateValues(),
  });

  useEffect(() => {
    const row = detailQuery.data;
    if (!row) return;
    reset({
      title: row.title,
      description: row.description ?? '',
      status: row.status,
      registrationStartAt: toDatetimeLocalValue(row.registrationStartAt),
      registrationEndAt: toDatetimeLocalValue(row.registrationEndAt),
      judgingStartAt: row.judgingStartAt
        ? toDatetimeLocalValue(row.judgingStartAt)
        : '',
      judgingEndAt: row.judgingEndAt
        ? toDatetimeLocalValue(row.judgingEndAt)
        : '',
      resultPublishedAt: row.resultPublishedAt
        ? toDatetimeLocalValue(row.resultPublishedAt)
        : '',
    });
  }, [detailQuery.data, reset]);

  const createMutation = useMutation({
    mutationFn: postChampionship,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['championships'] });
      void navigate('/championships');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof patchChampionship>[1]) =>
      patchChampionship(championshipId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['championships'] });
      void queryClient.invalidateQueries({
        queryKey: ['championship', championshipId],
      });
      void navigate('/championships');
    },
  });

  const serverError = (() => {
    const err = createMutation.error ?? updateMutation.error;
    if (!err) return null;
    return getAuthApiErrorMessage(
      err,
      isEdit
        ? 'Не удалось сохранить изменения.'
        : 'Не удалось создать чемпионат.',
    );
  })();

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && !Number.isFinite(championshipId)) {
    return (
      <Page>
        <Card>
          <Title>Некорректный адрес</Title>
          <FooterLinks>
            <TextLink to="/championships">К списку</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return (
      <Page>
        <Card>
          <Title>Загрузка…</Title>
        </Card>
      </Page>
    );
  }

  if (isEdit && detailQuery.isError) {
    return (
      <Page>
        <Card>
          <Title>Чемпионат</Title>
          <ErrorText>Не удалось загрузить данные.</ErrorText>
          <FooterLinks>
            <TextLink to="/championships">К списку</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  if (isEdit && detailQuery.data?.status === 'ARCHIVED') {
    return (
      <Page>
        <Card>
          <Title>Архив</Title>
          <Subtitle>
            Этот чемпионат в архиве и недоступен для редактирования.
          </Subtitle>
          <FooterLinks>
            <TextLink to="/championships">К списку</TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  const onSubmit = (data: FormValues) => {
    const title = data.title.trim();
    const description = data.description.trim();
    const base = {
      title,
      description: description || undefined,
      status: data.status,
      registrationStartAt: fromDatetimeLocalValue(data.registrationStartAt),
      registrationEndAt: fromDatetimeLocalValue(data.registrationEndAt),
      judgingStartAt: data.judgingStartAt.trim()
        ? fromDatetimeLocalValue(data.judgingStartAt)
        : undefined,
      judgingEndAt: data.judgingEndAt.trim()
        ? fromDatetimeLocalValue(data.judgingEndAt)
        : undefined,
      resultPublishedAt: data.resultPublishedAt.trim()
        ? fromDatetimeLocalValue(data.resultPublishedAt)
        : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(base);
    } else {
      createMutation.mutate(base);
    }
  };

  return (
    <Page>
      <Card style={{ maxWidth: 560, width: '100%' }}>
        <Title>
          {isEdit ? 'Редактирование чемпионата' : 'Новый чемпионат'}
        </Title>
        <Subtitle>
          Укажите название, статус и интервалы дат. Проверка порядка дат
          выполняется на сервере.
        </Subtitle>

        {serverError ? <ErrorText>{serverError}</ErrorText> : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="ch-title">Название</Label>
            <Input
              id="ch-title"
              aria-invalid={errors.title ? true : undefined}
              {...register('title', { required: 'Введите название' })}
            />
            {errors.title?.message ? (
              <FieldError role="alert">{errors.title.message}</FieldError>
            ) : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-desc">Описание (необязательно)</Label>
            <textarea
              id="ch-desc"
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

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-status">Статус</Label>
            <select
              id="ch-status"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
              }}
              {...register('status')}
            >
              {FORM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-reg-start">Начало регистрации</Label>
            <Input
              id="ch-reg-start"
              type="datetime-local"
              {...register('registrationStartAt', {
                required: 'Укажите дату',
              })}
            />
            {errors.registrationStartAt?.message ? (
              <FieldError role="alert">
                {errors.registrationStartAt.message}
              </FieldError>
            ) : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-reg-end">Окончание регистрации</Label>
            <Input
              id="ch-reg-end"
              type="datetime-local"
              {...register('registrationEndAt', {
                required: 'Укажите дату',
              })}
            />
            {errors.registrationEndAt?.message ? (
              <FieldError role="alert">
                {errors.registrationEndAt.message}
              </FieldError>
            ) : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-j-start">Начало судейства (необязательно)</Label>
            <Input
              id="ch-j-start"
              type="datetime-local"
              {...register('judgingStartAt')}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-j-end">
              Окончание судейства (необязательно)
            </Label>
            <Input
              id="ch-j-end"
              type="datetime-local"
              {...register('judgingEndAt')}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="ch-pub">Публикация итогов (необязательно)</Label>
            <Input
              id="ch-pub"
              type="datetime-local"
              {...register('resultPublishedAt')}
            />
          </div>

          <Button type="submit" disabled={isPending} style={{ marginTop: 20 }}>
            {isPending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </form>

        <FooterLinks>
          <TextLink to="/championships">К списку чемпионатов</TextLink>
          <TextLink to="/">На главную</TextLink>
        </FooterLinks>
      </Card>
    </Page>
  );
}
