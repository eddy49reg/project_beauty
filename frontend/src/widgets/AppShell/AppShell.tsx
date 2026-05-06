import { useAuthStore } from '../../store/authStore';
import {
  APP_SHELL_ADMIN_NAV,
  APP_SHELL_BRAND_TITLE,
  APP_SHELL_NAV_LINKS,
} from './constants';
import type { AppShellProps } from './types';
import { AppLink, Brand, Nav, Shell, TopBar } from './styles';

export function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <Shell>
      <TopBar>
        <Brand>{APP_SHELL_BRAND_TITLE}</Brand>
        <Nav>
          {APP_SHELL_NAV_LINKS.map(({ to, label }) => (
            <AppLink key={to} to={to}>
              {label}
            </AppLink>
          ))}
          {user ? (
            <AppLink to="/championships">Чемпионаты</AppLink>
          ) : null}
          {user?.appRole === 'ADMIN' ? (
            <AppLink to={APP_SHELL_ADMIN_NAV.to}>
              {APP_SHELL_ADMIN_NAV.label}
            </AppLink>
          ) : null}
        </Nav>
      </TopBar>
      {children}
    </Shell>
  );
}
