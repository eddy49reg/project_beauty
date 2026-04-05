import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

export const Page = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background:
    'linear-gradient(160deg, #f8f4ff 0%, #eef6ff 50%, #f5f5f5 100%)',
});

export const Card = styled('div')({
  width: '100%',
  maxWidth: 440,
  padding: 32,
  borderRadius: 16,
  background: '#fff',
  boxShadow:
    '0 4px 6px rgba(15, 23, 42, 0.06), 0 12px 24px rgba(15, 23, 42, 0.08)',
});

export const Title = styled('h1')({
  margin: '0 0 8px',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#0f172a',
});

export const Subtitle = styled('p')({
  margin: '0 0 24px',
  fontSize: '0.9rem',
  color: '#64748b',
});

export const Label = styled('label')({
  display: 'block',
  marginBottom: 6,
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155',
});

export const Input = styled('input')({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  marginBottom: 16,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  '&:focus': {
    borderColor: '#8b5cf6',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.15)',
  },
});

export const Button = styled('button')({
  width: '100%',
  padding: '12px 16px',
  marginTop: 8,
  border: 'none',
  borderRadius: 8,
  fontSize: '1rem',
  fontWeight: 600,
  color: '#fff',
  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, transform 0.1s ease',
  '&:hover:not(:disabled)': {
    opacity: 0.95,
  },
  '&:active:not(:disabled)': {
    transform: 'scale(0.99)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const FieldError = styled('span')({
  display: 'block',
  marginTop: 4,
  marginBottom: 12,
  fontSize: '0.8rem',
  color: '#b91c1c',
});

export const ErrorText = styled('p')({
  margin: '0 0 12px',
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: '0.875rem',
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
});

export const FooterLinks = styled('div')({
  marginTop: 20,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
});

export const TextLink = styled(Link)({
  fontSize: '0.875rem',
  color: '#6366f1',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});
