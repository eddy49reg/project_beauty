import { AppLink, TextButton } from '../../widgets/AppShell';
import { useAuthStore } from '../../store/authStore';
import { Heading, Hint, Lead, Line, Main } from './styles';

export function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <Main>
      <Heading>Beauty Championships</Heading>
      <Lead>
        Добро пожаловать. Здесь будет кабинет участника и организатора.
      </Lead>

      {user ? (
        <Line>
          Вы вошли как <strong>{user.login}</strong> ({user.firstname}{' '}
          {user.surname}
          ). Роль в приложении: <strong>{user.appRole ?? 'USER'}</strong>
          {!user.appRole ? (
            <Hint> (войдите снова, если только обновили приложение)</Hint>
          ) : null}
        </Line>
      ) : (
        <Line>
          <AppLink to="/login">Войти</AppLink>
          {' · '}
          <AppLink to="/register">Регистрация</AppLink>
        </Line>
      )}

      {user ? (
        <Line>
          <AppLink to="/championships">Чемпионаты</AppLink>
          {user.appRole === 'ADMIN' ? (
            <>
              {' · '}
              <AppLink to="/admin/users">Админ: пользователи</AppLink>
            </>
          ) : null}
          {' · '}
          <TextButton type="button" onClick={() => logout()}>
            Выйти
          </TextButton>
        </Line>
      ) : null}
    </Main>
  );
}
