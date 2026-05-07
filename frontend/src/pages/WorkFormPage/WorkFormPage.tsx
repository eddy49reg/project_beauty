import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getChampionship } from '../../entities/championships';
import { getAuthApiErrorMessage } from '../../entities/auth';
import { getNominations } from '../../entities/nominations';
import {
  deleteWork,
  getMyWork,
  patchWork,
  postWork,
  submitWork,
} from '../../entities/works';
import {
  Button,
  Card,
  ErrorText,
  FooterLinks,
  Input,
  Label,
  Page,
  Subtitle,
  TextLink,
  Title,
} from '../LoginPage/styles';

type FormValues = {
  nominationId: string;
  title: string;
  description: string;
};

export function WorkFormPage() {
  const { championshipId: chIdParam, workId: workIdParam } = useParams<{
    championshipId: string;
    workId: string;
  }>();
  const championshipId = chIdParam ? Number(chIdParam) : NaN;
  const workId = workIdParam ? Number(workIdParam) : NaN;
  const isEdit = Number.isFinite(workId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, reset, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { nominationId: '', title: '', description: '' },
  });

  const chQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const nomsQuery = useQuery({
    queryKey: ['nominations', championshipId],
    queryFn: () => getNominations(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const workQuery = useQuery({
    queryKey: ['work', championshipId, workId],
    queryFn: () => getMyWork(championshipId, workId),
    enabled: isEdit && Number.isFinite(championshipId),
  });

  useEffect(() => {
    if (!workQuery.data) return;
    reset({
      nominationId: String(workQuery.data.nominationId),
      title: workQuery.data.title,
      description: workQuery.data.description ?? '',
    });
  }, [workQuery.data, reset]);

  const goList = () => navigate(`/championships/${championshipId}/works/my`);

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      postWork(championshipId, {
        nominationId: Number(v.nominationId),
        title: v.title.trim(),
        description: v.description.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['works', 'my', championshipId],
      });
      goList();
    },
  });

  const updateMut = useMutation({
    mutationFn: (v: FormValues) =>
      patchWork(championshipId, workId, {
        title: v.title.trim(),
        description: v.description.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['works', 'my', championshipId],
      });
      goList();
    },
  });

  const submitMut = useMutation({
    mutationFn: () => submitWork(championshipId, workId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['works', 'my', championshipId],
      });
      goList();
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteWork(championshipId, workId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['works', 'my', championshipId],
      });
      goList();
    },
  });

  const serverError = getAuthApiErrorMessage(
    createMut.error ?? updateMut.error ?? submitMut.error ?? deleteMut.error,
    'Операция с работой завершилась ошибкой.',
  );

  if (!Number.isFinite(championshipId)) {
    return (
      <Page>
        <Card>
          <Title>Некорректный адрес</Title>
        </Card>
      </Page>
    );
  }

  if (chQuery.isLoading || nomsQuery.isLoading || (isEdit && workQuery.isLoading)) {
    return (
      <Page>
        <Card>
          <Title>Загрузка…</Title>
        </Card>
      </Page>
    );
  }

  if (chQuery.isError || nomsQuery.isError || (isEdit && workQuery.isError)) {
    return (
      <Page>
        <Card>
          <Title>Работа</Title>
          <ErrorText>Не удалось загрузить данные.</ErrorText>
          <FooterLinks>
            <TextLink to={`/championships/${championshipId}/works/my`}>
              К моим работам
            </TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  const isPending =
    createMut.isPending ||
    updateMut.isPending ||
    submitMut.isPending ||
    deleteMut.isPending;

  const readOnly = isEdit && workQuery.data?.status !== 'DRAFT';

  const onSubmit = (v: FormValues) => {
    if (isEdit) {
      updateMut.mutate(v);
      return;
    }
    createMut.mutate(v);
  };

  return (
    <Page>
      <Card style={{ maxWidth: 560 }}>
        <Title>{isEdit ? 'Моя работа' : 'Новая работа'}</Title>
        <Subtitle>
          Заполните данные и отправьте работу до окончания регистрации.
        </Subtitle>
        {serverError ? <ErrorText>{serverError}</ErrorText> : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="work-nomination">Номинация</Label>
            <select
              id="work-nomination"
              disabled={isEdit || readOnly}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
              }}
              {...register('nominationId', { required: true })}
            >
              <option value="">— выберите —</option>
              {(nomsQuery.data ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="work-title">Название работы</Label>
            <Input id="work-title" disabled={readOnly} {...register('title', { required: true })} />
          </div>

          <div style={{ marginTop: 12 }}>
            <Label htmlFor="work-description">Описание</Label>
            <textarea
              id="work-description"
              rows={5}
              disabled={readOnly}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: '1rem',
                minHeight: 100,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              {...register('description')}
            />
          </div>

          {!readOnly ? (
            <Button type="submit" disabled={isPending || !watch('nominationId')} style={{ marginTop: 20 }}>
              {isPending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          ) : null}
        </form>

        {isEdit && !readOnly ? (
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => submitMut.mutate()}
              disabled={isPending}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                background: '#0f766e',
                cursor: 'pointer',
              }}
            >
              Отправить
            </button>
            <button
              type="button"
              onClick={() => deleteMut.mutate()}
              disabled={isPending}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                background: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              Удалить
            </button>
          </div>
        ) : null}

        {isEdit ? (
          <Subtitle style={{ marginTop: 14, marginBottom: 0 }}>
            Статус: <strong>{workQuery.data?.status}</strong>
          </Subtitle>
        ) : null}

        <FooterLinks>
          <TextLink to={`/championships/${championshipId}/works/my`}>
            К моим работам
          </TextLink>
          <Link to="/championships">К чемпионатам</Link>
        </FooterLinks>
      </Card>
    </Page>
  );
}
