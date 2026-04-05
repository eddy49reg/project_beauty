import styled from '@emotion/styled';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

const Shell = styled.div`
  min-height: 100vh;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
`;

const Brand = styled.span`
  font-weight: 700;
  color: #0f172a;
`;

const Nav = styled.nav`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const StyledLink = styled(Link)`
  color: #6366f1;
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #64748b;
  font-size: 0.9rem;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Main = styled.main`
  padding: 32px 24px;
  max-width: 720px;
  margin: 0 auto;
`;

function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <Main>
      <h1>Beauty Championships</h1>
      <p>Добро пожаловать. Здесь будет кабинет участника и организатора.</p>
      {user ? (
        <p>
          Вы вошли как <strong>{user.login}</strong> ({user.firstname}{' '}
          {user.surname}).
        </p>
      ) : (
        <p>
          <StyledLink to="/login">Войти</StyledLink>
          {' · '}
          <StyledLink to="/register">Регистрация</StyledLink>
        </p>
      )}
      {user ? (
        <p>
          <ButtonLink type="button" onClick={() => logout()}>
            Выйти
          </ButtonLink>
        </p>
      ) : null}
    </Main>
  );
}

function AppRoutes() {
  return (
    <Shell>
      <TopBar>
        <Brand>Beauty Cup</Brand>
        <Nav>
          <StyledLink to="/">Главная</StyledLink>
          <StyledLink to="/login">Вход</StyledLink>
          <StyledLink to="/register">Регистрация</StyledLink>
        </Nav>
      </TopBar>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
