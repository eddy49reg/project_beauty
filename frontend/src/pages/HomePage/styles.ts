import styled from '@emotion/styled';

/** Контентная колонка главной (узкая ширина для текста). */
export const Main = styled('main')({
  padding: '32px 24px',
  maxWidth: 720,
  margin: '0 auto',
});

export const Heading = styled('h1')({
  margin: '0 0 12px',
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#0f172a',
});

export const Lead = styled('p')({
  margin: '0 0 16px',
  fontSize: '1rem',
  color: '#334155',
});

export const Line = styled('p')({
  margin: '0 0 8px',
  fontSize: '0.95rem',
  color: '#0f172a',
});

/** Подсказка про повторный вход после обновления API (старый persist без appRole). */
export const Hint = styled('span')({
  color: '#64748b',
  fontSize: '0.85rem',
});
