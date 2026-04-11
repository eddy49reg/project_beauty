import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  getAuthApiErrorMessage,
  type RegisterBody,
  useRegisterMutation,
} from '../../entities/auth';
import {
  LOGIN_RE,
  LOGIN_RE_MESSAGE,
  NAME_RE,
  NAME_RE_MESSAGE,
  TG_USERNAME_MESSAGE,
  TG_USERNAME_RE,
} from '../../lib/authValidation';
import { parseToE164 } from '../../lib/phoneE164';
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

type RegisterFormValues = RegisterBody & { confirmPassword: string };

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      login: '',
      password: '',
      confirmPassword: '',
      firstname: '',
      surname: '',
      phone: '',
      tg: '',
    },
  });

  const mutation = useRegisterMutation({
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      void navigate('/');
    },
  });

  const serverErrorMessage = mutation.isError
    ? getAuthApiErrorMessage(
        mutation.error,
        'Не удалось зарегистрироваться. Проверьте данные.',
      )
    : null;

  return (
    <Page>
      <Card>
        <Title>Регистрация</Title>
        <Subtitle>Создайте аккаунт для участия в чемпионатах</Subtitle>
        {serverErrorMessage ? (
          <ErrorText>{serverErrorMessage}</ErrorText>
        ) : null}
        <form
          onSubmit={handleSubmit((data) => {
            const phone = parseToE164(data.phone)!;
            const tgRaw = data.tg?.trim();
            const body: RegisterBody = {
              login: data.login.trim(),
              password: data.password,
              firstname: data.firstname.trim(),
              surname: data.surname.trim(),
              phone,
              tg: tgRaw ? tgRaw.toLowerCase() : undefined,
            };
            mutation.reset();
            mutation.mutate(body);
          })}
          noValidate
        >
          <div>
            <Label htmlFor="reg-login">Логин</Label>
            <Input
              id="reg-login"
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
            <Label htmlFor="reg-firstname">Имя</Label>
            <Input
              id="reg-firstname"
              autoComplete="given-name"
              aria-invalid={errors.firstname ? true : undefined}
              {...register('firstname', {
                required: 'Введите имя',
                validate: (v) => NAME_RE.test(v.trim()) || NAME_RE_MESSAGE,
              })}
            />
            {errors.firstname?.message ? (
              <FieldError role="alert">{errors.firstname.message}</FieldError>
            ) : null}
          </div>
          <div>
            <Label htmlFor="reg-surname">Фамилия</Label>
            <Input
              id="reg-surname"
              autoComplete="family-name"
              aria-invalid={errors.surname ? true : undefined}
              {...register('surname', {
                required: 'Введите фамилию',
                validate: (v) => NAME_RE.test(v.trim()) || NAME_RE_MESSAGE,
              })}
            />
            {errors.surname?.message ? (
              <FieldError role="alert">{errors.surname.message}</FieldError>
            ) : null}
          </div>
          <div>
            <Label htmlFor="reg-phone">Телефон</Label>
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="Например, 89991234567 или +44 20 7946 0958"
              aria-invalid={errors.phone ? true : undefined}
              {...register('phone', {
                required: 'Введите телефон',
                validate: (v) =>
                  parseToE164(v) != null ||
                  'Некорректный номер: РФ без кода страны или международный (+…)',
              })}
            />
            {errors.phone?.message ? (
              <FieldError role="alert">{errors.phone.message}</FieldError>
            ) : null}
          </div>
          <div>
            <Label htmlFor="reg-tg">Telegram (необязательно)</Label>
            <Input
              id="reg-tg"
              autoComplete="off"
              placeholder="@username"
              aria-invalid={errors.tg ? true : undefined}
              {...register('tg', {
                validate: (v) => {
                  const t = v?.trim();
                  if (!t) return true;
                  const lower = t.toLowerCase();
                  return TG_USERNAME_RE.test(lower) || TG_USERNAME_MESSAGE;
                },
              })}
            />
            {errors.tg?.message ? (
              <FieldError role="alert">{errors.tg.message}</FieldError>
            ) : null}
          </div>
          <div>
            <Label htmlFor="reg-password">Пароль</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              {...register('password', {
                required: 'Придумайте пароль',
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
          <div>
            <Label htmlFor="reg-confirm">Повтор пароля</Label>
            <Input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              {...register('confirmPassword', {
                required: 'Повторите пароль',
                validate: (v) =>
                  v === getValues('password') || 'Пароли должны совпадать',
              })}
            />
            {errors.confirmPassword?.message ? (
              <FieldError role="alert">
                {errors.confirmPassword.message}
              </FieldError>
            ) : null}
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Регистрация…' : 'Зарегистрироваться'}
          </Button>
        </form>
        <FooterLinks>
          <TextLink to="/">На главную</TextLink>
          <TextLink to="/login">Уже есть аккаунт? Войти</TextLink>
        </FooterLinks>
      </Card>
    </Page>
  );
}
