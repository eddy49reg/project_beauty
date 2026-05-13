import styled from '@emotion/styled';

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
