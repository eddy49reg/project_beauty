import styled from '@emotion/styled';

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
