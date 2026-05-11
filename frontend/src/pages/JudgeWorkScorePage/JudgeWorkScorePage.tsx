import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  finalizeJudgeScore,
  getJudgeWork,
  putJudgeScore,
} from '../../entities/judging';
import { getAuthApiErrorMessage } from '../../entities/auth';
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
  score: string;
  comment: string;
};

export function JudgeWorkScorePage() {
  const { championshipId: chParam, workId: workParam } = useParams<{
    championshipId: string;
    workId: string;
  }>();
  const championshipId = chParam ? Number(chParam) : NaN;
  const workId = workParam ? Number(workParam) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { score: '', comment: '' },
  });

  const workQuery = useQuery({
    queryKey: ['judging', 'work', championshipId, workId],
    queryFn: () => getJudgeWork(championshipId, workId),
    enabled: Number.isFinite(championshipId) && Number.isFinite(workId),
  });

  useEffect(() => {
    const row = workQuery.data;
    if (!row) return;
    reset({
      score: row.myScore ? String(row.myScore.score) : '',
      comment: row.myScore?.comment ?? '',
    });
  }, [workQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      putJudgeScore(championshipId, workId, {
        score: Number(values.score),
        comment: values.comment.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['judging', 'works', championshipId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['judging', 'work', championshipId, workId],
      });
      navigate(`/championships/${championshipId}/judging/works`);
    },
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeJudgeScore(championshipId, workId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['judging', 'works', championshipId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['judging', 'work', championshipId, workId],
      });
      navigate(`/championships/${championshipId}/judging/works`);
    },
  });

  const error = getAuthApiErrorMessage(
    workQuery.error ?? saveMutation.error ?? finalizeMutation.error,
    'Не удалось сохранить оценку.',
  );

  if (!Number.isFinite(championshipId) || !Number.isFinite(workId)) {
    return (
      <Page>
        <Card>
          <Title>Некорректный адрес</Title>
        </Card>
      </Page>
    );
  }

  if (workQuery.isLoading) {
    return (
      <Page>
        <Card>
          <Title>Загрузка…</Title>
        </Card>
      </Page>
    );
  }

  if (workQuery.isError || !workQuery.data) {
    return (
      <Page>
        <Card>
          <Title>Оценка работы</Title>
          <ErrorText>{error}</ErrorText>
          <FooterLinks>
            <TextLink to={`/championships/${championshipId}/judging/works`}>
              К списку работ
            </TextLink>
          </FooterLinks>
        </Card>
      </Page>
    );
  }

  const row = workQuery.data;
  const isFinal = row.myScore?.isFinal === true;

  return (
    <Page>
      <Card style={{ maxWidth: 560 }}>
        <Title>Оценка работы</Title>
        <Subtitle>
          Номинация: <strong>{row.nomination.title}</strong>
          <br />
          Участник: {row.author.surname} {row.author.firstname}
          <br />
          Работа: {row.title}
        </Subtitle>

        {row.description ? (
          <Subtitle style={{ marginTop: -8, color: '#334155' }}>
            {row.description}
          </Subtitle>
        ) : null}

        {error && saveMutation.isError ? <ErrorText>{error}</ErrorText> : null}

        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
          <div>
            <Label htmlFor="judge-score">Оценка (0–100)</Label>
            <Input
              id="judge-score"
              type="number"
              min={0}
              max={100}
              disabled={isFinal}
              {...register('score', { required: true })}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Label htmlFor="judge-comment">Комментарий</Label>
            <textarea
              id="judge-comment"
              rows={5}
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
              disabled={isFinal}
              {...register('comment')}
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending || finalizeMutation.isPending || isFinal}
            style={{ marginTop: 20 }}
          >
            {saveMutation.isPending ? 'Сохранение…' : 'Сохранить черновик'}
          </Button>
        </form>

        {!isFinal ? (
          <button
            type="button"
            disabled={finalizeMutation.isPending || saveMutation.isPending}
            onClick={() => finalizeMutation.mutate()}
            style={{
              marginTop: 12,
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fff',
              background: '#0f766e',
              cursor: 'pointer',
            }}
          >
            {finalizeMutation.isPending ? 'Финализация…' : 'Финализировать оценку'}
          </button>
        ) : null}

        {isFinal ? (
          <Subtitle style={{ marginTop: 14, marginBottom: 0 }}>
            Оценка финализирована и недоступна для редактирования.
          </Subtitle>
        ) : null}

        <FooterLinks>
          <TextLink to={`/championships/${championshipId}/judging/works`}>
            К списку работ
          </TextLink>
          <Link to="/championships">К чемпионатам</Link>
        </FooterLinks>
      </Card>
    </Page>
  );
}
