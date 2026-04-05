import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  getAuthApiErrorMessage,
  type RegisterBody,
  useRegisterMutation,
} from '../../entities/auth';
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

type RegisterFormValues = Omit<RegisterBody, 'phone'> & {
  phone: string;
  confirmPassword: string;
};

function digitsToPhoneNumber(value: string): number {
  return Number(value.replace(/\D/g, ''));
}

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
            const phone = digitsToPhoneNumber(data.phone);
            const body: RegisterBody = {
              login: data.login,
              password: data.password,
              firstname: data.firstname,
              surname: data.surname,
              phone,
              tg: data.tg?.trim() || undefined,
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
                maxLength: {
                  value: 50,
                  message: 'Не больше 50 символов',
                },
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
                maxLength: {
                  value: 100,
                  message: 'Не больше 100 символов',
                },
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
                maxLength: {
                  value: 100,
                  message: 'Не больше 100 символов',
                },
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
              placeholder="Например, 79991234567"
              aria-invalid={errors.phone ? true : undefined}
              {...register('phone', {
                required: 'Введите телефон',
                validate: (v) => {
                  const n = digitsToPhoneNumber(v);
                  if (!Number.isSafeInteger(n) || n < 1_000_000_000) {
                    return 'Укажите корректный номер (цифры, от 10 знаков)';
                  }
                  return true;
                },
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
                maxLength: {
                  value: 100,
                  message: 'Не больше 100 символов',
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
