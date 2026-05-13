import { useAuthStore } from '../../store/authStore';
import {
  APP_SHELL_ADMIN_NAV,
  APP_SHELL_BRAND_TITLE,
  APP_SHELL_GUEST_NAV,
  APP_SHELL_USER_NAV,
} from './constants';
import type { AppShellProps } from './types';
import { AppLink, Brand, Nav, Shell, TextButton, TopBar } from './styles';

export function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const navLinks = user ? APP_SHELL_USER_NAV : APP_SHELL_GUEST_NAV;

  return (
    <Shell>
      <TopBar>
        <Brand>
          <AppLink to="/">{APP_SHELL_BRAND_TITLE}</AppLink>
        </Brand>
        <Nav>
          {navLinks.map(({ to, label }) => (
            <AppLink key={to} to={to}>
              {label}
            </AppLink>
          ))}
          {user?.appRole === 'ADMIN' ? (
            <AppLink to={APP_SHELL_ADMIN_NAV.to}>{APP_SHELL_ADMIN_NAV.label}</AppLink>
          ) : null}
          {user ? (
            <TextButton type="button" onClick={() => logout()}>
              Выйти ({user.login})
            </TextButton>
          ) : null}
        </Nav>
      </TopBar>
      {children}
    </Shell>
  );
}
