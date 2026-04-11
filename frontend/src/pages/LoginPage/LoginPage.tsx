import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  getAuthApiErrorMessage,
  type LoginBody,
  useLoginMutation,
} from '../../entities/auth';
import { LOGIN_RE, LOGIN_RE_MESSAGE } from '../../lib/authValidation';
import { useAuthStore } from '../../store/authStore';
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
} from './styles';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({
    defaultValues: { login: '', password: '' },
  });

  const mutation = useLoginMutation({
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      void navigate('/');
    },
  });

  const serverErrorMessage = mutation.isError
    ? getAuthApiErrorMessage(
        mutation.error,
        'Не удалось войти. Проверьте данные.',
      )
    : null;

  return (
    <Page>
      <Card>
        <Title>Вход</Title>
        <Subtitle>Чемпионаты beauty — личный кабинет</Subtitle>
        {serverErrorMessage ? (
          <ErrorText>{serverErrorMessage}</ErrorText>
        ) : null}
        <form
          onSubmit={handleSubmit((data) => {
            mutation.reset();
            mutation.mutate({
              login: data.login.trim(),
              password: data.password,
            });
          })}
          noValidate
        >
          <div>
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              autoComplete="username"
              aria-invalid={errors.login ? true : undefined}
              {...register('login', {
                required: 'Введите логин',
                validate: (v) => LOGIN_RE.test(v.trim()) || LOGIN_RE_MESSAGE,
              })}
            />
            {errors.login?.message ? (
              <FieldError role="alert">{errors.login.message}</FieldError>
            ) : null}
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...register('password', {
                required: 'Введите пароль',
                minLength: {
                  value: 6,
                  message: 'Минимум 6 символов',
                },
                maxLength: {
                  value: 128,
                  message: 'Не больше 128 символов',
                },
              })}
            />
            {errors.password?.message ? (
              <FieldError role="alert">{errors.password.message}</FieldError>
            ) : null}
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Вход…' : 'Войти'}
          </Button>
        </form>
        <FooterLinks>
          <TextLink to="/">На главную</TextLink>
          <TextLink to="/register">Регистрация</TextLink>
        </FooterLinks>
      </Card>
    </Page>
  );
}
