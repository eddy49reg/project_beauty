import styled from '@emotion/styled';
import { Card, Page, Subtitle, Title } from '../LoginPage/styles';

export const AdminPage = styled(Page)({
  alignItems: 'flex-start',
  paddingTop: 24,
  paddingBottom: 48,
});

export const WideCard = styled(Card)({
  maxWidth: 960,
  width: '100%',
});

export { Title, Subtitle };

export const TableWrap = styled('div')({
  overflowX: 'auto',
  marginTop: 16,
});

export const Table = styled('table')({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
});

export const Th = styled('th')({
  textAlign: 'left',
  padding: '10px 8px',
  borderBottom: '2px solid #e2e8f0',
  color: '#475569',
  fontWeight: 600,
});

export const Td = styled('td')({
  padding: '10px 8px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle',
});

export const RoleSelect = styled('select')({
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  fontSize: '0.875rem',
  background: '#fff',
});

export const ErrorText = styled('p')({
  margin: '12px 0 0',
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: '0.875rem',
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
});

export const Muted = styled('p')({
  margin: '16px 0 0',
  fontSize: '0.85rem',
  color: '#64748b',
});
