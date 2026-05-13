import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

export const TextLink = styled(Link)({
  fontSize: '0.875rem',
  color: '#6366f1',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});
