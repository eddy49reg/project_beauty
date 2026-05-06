import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

export const Shell = styled('div')({
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

export const TopBar = styled('header')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
});

export const Brand = styled('span')({
  fontWeight: 700,
  color: '#0f172a',
});

export const Nav = styled('nav')({
  display: 'flex',
  gap: 16,
  alignItems: 'center',
});

export const AppLink = styled(Link)({
  color: '#6366f1',
  textDecoration: 'none',
  fontSize: '0.9rem',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export const TextButton = styled('button')({
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#64748b',
  fontSize: '0.9rem',
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
});
