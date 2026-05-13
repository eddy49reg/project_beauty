import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAuthApiErrorMessage } from '../../entities/auth';
import {
  getChampionship,
  getRegistrationContact,
} from '../../entities/championships';
import {
  Card,
  ErrorText,
  FooterLinks,
  Page,
  Subtitle,
  TextLink,
  Title,
} from '../../shared/ui';

function telegramDisplayLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (t.startsWith('@')) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `@${t}`;
}

function telegramHref(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const handle = t.replace(/^@/, '');
  return `https://t.me/${encodeURIComponent(handle)}`;
}

export function ApplyParticipationPage() {
  const { championshipId: chIdParam } = useParams<{
    championshipId: string;
  }>();
  const championshipId = chIdParam ? Number(chIdParam) : NaN;

  const championshipQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const ch = championshipQuery.data;
  const mayRequestContact = Boolean(ch?.canApplyAsParticipant);

  const contactQuery = useQuery({
    queryKey: ['championship', championshipId, 'registration-contact'],
    queryFn: () => getRegistrationContact(championshipId),
    enabled: Number.isFinite(championshipId) && mayRequestContact,
  });

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

  const championshipError =
    championshipQuery.isError && championshipQuery.error
      ? getAuthApiErrorMessage(
          championshipQuery.error,
          'Не удалось загрузить чемпионат.',
        )
      : null;

  const contactError =
    contactQuery.isError && contactQuery.error
      ? getAuthApiErrorMessage(
          contactQuery.error,
          'Не удалось получить контакт организатора.',
        )
      : null;

  return (
    <Page>
      <Card>
        <Title>Участие в чемпионате</Title>
        {ch ? (
          <Subtitle>
            Событие: <strong>{ch.title}</strong>
          </Subtitle>
        ) : null}

        {championshipError ? <ErrorText>{championshipError}</ErrorText> : null}

        {championshipQuery.isLoading ? <Subtitle>Загрузка…</Subtitle> : null}

        {ch && !ch.canApplyAsParticipant ? (
          <Subtitle style={{ marginTop: 16 }}>
            Сейчас эта страница вам недоступна: нет окна регистрации для заявки
            без роли в чемпионате, либо у вас уже есть роль в этом событии.
          </Subtitle>
        ) : null}

        {mayRequestContact && contactQuery.isLoading ? (
          <Subtitle style={{ marginTop: 16 }}>Загрузка контакта…</Subtitle>
        ) : null}

        {mayRequestContact && contactError ? (
          <ErrorText>{contactError}</ErrorText>
        ) : null}

        {mayRequestContact && contactQuery.data ? (
          <div
            style={{
              marginTop: 20,
              padding: '16px 18px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              lineHeight: 1.55,
              fontSize: '1.05rem',
            }}
          >
            <p style={{ margin: 0 }}>
              Для подачи заявки на регистрацию обратитесь в Telegram к
              организатору чемпионата
              {contactQuery.data.organizerTelegram ? (
                <>
                  :{' '}
                  <a
                    href={telegramHref(contactQuery.data.organizerTelegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {telegramDisplayLabel(contactQuery.data.organizerTelegram)}
                  </a>
                  {contactQuery.data.organizerDisplayName
                    ? ` (${contactQuery.data.organizerDisplayName})`
                    : null}
                  .
                </>
              ) : (
                <>
                  . Контакт организатора в профиле не указан — напишите
                  администратору площадки или уточните способ регистрации у
                  кураторов события.
                </>
              )}
            </p>
          </div>
        ) : null}

        <FooterLinks style={{ marginTop: 24 }}>
          <Link to="/championships">← К списку чемпионатов</Link>
        </FooterLinks>
      </Card>
    </Page>
  );
}
