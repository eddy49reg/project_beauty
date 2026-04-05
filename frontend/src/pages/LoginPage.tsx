import styled from '@emotion/styled';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

type LoginResponse = {
  accessToken: string;
  user: {
    id: number;
    login: string;
    firstname: string;
    surname: string;
    phone: string;
    tg: string | null;
  };
};

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #f8f4ff 0%, #eef6ff 50%, #f5f5f5 100%);
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 32px;
  border-radius: 16px;
  background: #fff;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.06),
    0 12px 24px rgba(15, 23, 42, 0.08);
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 0 0 24px;
  font-size: 0.9rem;
  color: #64748b;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 16px;
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.1s ease;

  &:hover:not(:disabled) {
    opacity: 0.95;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 20px;
  font-size: 0.875rem;
  color: #6366f1;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        login,
        password,
      });
      return data;
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      void navigate('/');
    },
  });

  const errorMessage = (() => {
    const err = mutation.error;
    if (!err) return null;
    if (axios.isAxiosError(err)) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as { message: unknown }).message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
      }
    }
    return mutation.isError ? 'Не удалось войти. Проверьте данные.' : null;
  })();

  return (
    <Page>
      <Card>
        <Title>Вход</Title>
        <Subtitle>Чемпионаты beauty — личный кабинет</Subtitle>
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              name="login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Вход…' : 'Войти'}
          </Button>
        </form>
        <BackLink to="/">На главную</BackLink>
      </Card>
    </Page>
  );
}
