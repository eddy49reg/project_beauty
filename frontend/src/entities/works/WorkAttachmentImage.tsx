import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Props = {
  championshipId: number;
  workId: number;
  attachmentId: number;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Превью вложения: публичный yadi.sk/d/... — страница просмотра, не поток изображения для тега img.
 * Качаем байты через API с JWT и показываем blob URL.
 */
export function WorkAttachmentImage({
  championshipId,
  workId,
  attachmentId,
  alt,
  className,
  style,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setFailed(false);
    setSrc(null);
    (async () => {
      try {
        const res = await api.get<Blob>(
          `championships/${championshipId}/works/${workId}/attachments/${attachmentId}/file`,
          { responseType: 'blob' },
        );
        const blob = res.data;
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setSrc(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [championshipId, workId, attachmentId]);

  if (failed) {
    return (
      <span className={className} style={{ fontSize: '0.8rem', color: '#94a3b8', ...style }}>
        не удалось загрузить превью
      </span>
    );
  }
  if (!src) {
    return (
      <span className={className} style={{ fontSize: '0.8rem', color: '#94a3b8', ...style }}>
        …
      </span>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} />;
}
