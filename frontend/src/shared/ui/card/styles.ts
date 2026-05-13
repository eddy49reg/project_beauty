import styled from '@emotion/styled';

export const Card = styled('div', {
  shouldForwardProp: (prop) => prop !== '$maxWidth',
})<{ $maxWidth?: number }>(({ $maxWidth = 400 }) => ({
  width: '100%',
  maxWidth: $maxWidth,
  padding: 32,
  borderRadius: 16,
  background: '#fff',
  boxShadow:
    '0 4px 6px rgba(15, 23, 42, 0.06), 0 12px 24px rgba(15, 23, 42, 0.08)',
}));
