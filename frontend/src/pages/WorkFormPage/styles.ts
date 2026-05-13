import styled from '@emotion/styled';
import { Button, Card, Subtitle } from '../../shared/ui';

export const FormCard = styled(Card)({
  maxWidth: 640,
});

export const FieldBlock = styled('div')({
  marginTop: 12,
});

export const Section = styled('div')({
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid #e2e8f0',
});

export const SectionLoose = styled('div')({
  marginTop: 24,
  paddingTop: 16,
  borderTop: '1px solid #e2e8f0',
});

export const NominationSelect = styled('select')({
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: '1rem',
});

export const DescriptionArea = styled('textarea')({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: '1rem',
  minHeight: 100,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
});

export const FileInput = styled('input')({
  marginTop: 8,
});

export const DraftFileList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  marginTop: 12,
});

export const DraftFileRow = styled('li')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
  fontSize: '0.9rem',
  color: '#475569',
});

export const AttachmentList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  marginTop: 12,
});

export const AttachmentRow = styled('li')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
  flexWrap: 'wrap',
});

export const Thumb = styled('img')({
  maxWidth: 160,
  maxHeight: 120,
  borderRadius: 8,
  objectFit: 'cover' as const,
});

export const Muted = styled('span')({
  color: '#64748b',
});

export const MutedSmall = styled('span')({
  fontSize: '0.85rem',
  color: '#64748b',
});

export const TextButton = styled('button')({
  border: 'none',
  background: 'none',
  color: '#b91c1c',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '0.85rem',
});

export const TextButtonLg = styled(TextButton)({
  fontSize: '0.9rem',
});

export const ActionRow = styled('div')({
  marginTop: 16,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const PrimaryAction = styled('button')({
  border: 'none',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#fff',
  background: '#0f766e',
  cursor: 'pointer',
  '&:disabled': {
    background: '#94a3b8',
    cursor: 'not-allowed',
  },
});

export const DangerAction = styled('button')({
  border: 'none',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#fff',
  background: '#b91c1c',
  cursor: 'pointer',
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const UploadPending = styled(Subtitle)({
  marginTop: 8,
});

export const HintBlock = styled(Subtitle)({
  marginTop: 8,
  marginBottom: 8,
});

export const FormSubmit = styled(Button)({
  marginTop: 20,
});

export const StatusLine = styled(Subtitle)({
  marginTop: 14,
  marginBottom: 0,
});
