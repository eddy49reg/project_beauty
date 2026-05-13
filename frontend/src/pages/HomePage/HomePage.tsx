import { AppLink, TextButton } from '../../widgets/AppShell';
import { useAuthStore } from '../../store/authStore';
import { Heading, Hint, Lead, Line, Main } from './styles';

export function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <Main>
      <Heading>Beauty Championships</Heading>
      <Lead>
        Платформа для онлайн-чемпионатов: номинации, работы участников, судейство и
        публикация результатов.
      </Lead>

      {user ? (
        <>
          <Line>
            Вы вошли как <strong>{user.login}</strong> ({user.firstname} {user.surname}
            ). Роль: <strong>{user.appRole ?? 'USER'}</strong>
            {!user.appRole ? (
              <Hint> (при обновлении приложения войдите снова)</Hint>
            ) : null}
          </Line>
          <Line>
            <AppLink to="/championships">Перейти к чемпионатам</AppLink>
            {user.appRole === 'ADMIN' ? (
              <>
                {' · '}
                <AppLink to="/admin/users">Администрирование пользователей</AppLink>
              </>
            ) : null}
            {' · '}
            <TextButton type="button" onClick={() => logout()}>
              Выйти
            </TextButton>
          </Line>
        </>
      ) : (
        <Line>
          <AppLink to="/login">Войти</AppLink>
          {' · '}
          <AppLink to="/register">Создать аккаунт</AppLink>
        </Line>
      )}
    </Main>
  );
}
