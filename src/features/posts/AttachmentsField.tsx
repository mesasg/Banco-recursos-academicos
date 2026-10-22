import { useId, useState, type KeyboardEvent } from 'react';
import { AlertCircle, CheckCircle2, Link2, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { FileDropzone } from '@/components/FileDropzone';
import { Input } from '@/components/Input';
import { AttachmentIcon } from '@/components/PostCard';
import type { Attachment, AttachmentKind } from '@/types';
import { formatFileSize } from '@/utils/format';
import { cn } from '@/utils/text';
import { isValidUrl, normalizeUrl } from '@/utils/validation';

/** Un adjunto dentro del formulario: ya guardado, subiéndose o con error. */
export interface FormAttachment {
  key: string;
  kind: AttachmentKind;
  name: string;
  sizeBytes?: number;
  status: 'done' | 'uploading' | 'error';
  progress: number;
  attachment?: Attachment;
  /** Se conserva para reintentar la subida. */
  file?: File;
  error?: string;
  /** Agregado en esta edición (no estaba guardado). */
  isNew?: boolean;
}

interface AttachmentsFieldProps {
  items: FormAttachment[];
  onAddFiles: (files: File[]) => void;
  onAddLink: (url: string) => void;
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
  error?: string;
}

function statusText(item: FormAttachment): string {
  if (item.status === 'uploading') return `Subiendo… ${item.progress}%`;
  if (item.status === 'error') return item.error ?? 'No se pudo subir';
  if (item.kind === 'link') return item.attachment?.url ?? '';
  return [formatFileSize(item.sizeBytes), item.isNew ? 'Listo' : 'Guardado'].filter(Boolean).join(' · ');
}

export function AttachmentsField({ items, onAddFiles, onAddLink, onRemove, onRetry, error }: AttachmentsFieldProps) {
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string>();
  const [rejections, setRejections] = useState<string[]>([]);
  const errorId = useId();

  const addLink = () => {
    const url = normalizeUrl(link);
    if (!url) return setLinkError('Pega la dirección del enlace.');
    if (!isValidUrl(url)) return setLinkError('El enlace no es válido. Ejemplo: https://www.ejemplo.com/recurso');
    if (items.some((i) => i.attachment?.url === url)) return setLinkError('Ya agregaste este enlace.');
    onAddLink(url);
    setLink('');
    setLinkError(undefined);
  };

  const onLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addLink();
    }
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-medium text-ink">
        Archivos y enlaces
        <span className="text-danger" aria-hidden>
          {' '}*
        </span>
        <span className="ml-1 font-normal text-ink-muted">(al menos uno)</span>
      </legend>

      <FileDropzone
        onFiles={(files) => {
          setRejections([]);
          onAddFiles(files);
        }}
        onReject={setRejections}
        error={error}
        describedById={error ? errorId : undefined}
      />

      {rejections.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {rejections.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-2">
        <Input
          label="Agregar enlace"
          hideLabel
          type="url"
          inputMode="url"
          placeholder="Pega un enlace (video, simulador, artículo…)"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            if (linkError) setLinkError(undefined);
          }}
          onKeyDown={onLinkKeyDown}
          error={linkError}
          startIcon={<Link2 className="h-4 w-4" />}
          containerClassName="flex-1"
        />
        <Button variant="secondary" onClick={addLink} className="shrink-0">
          Agregar
        </Button>
      </div>

      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Adjuntos agregados">
          {items.map((item) => {
            const preview = item.kind === 'image' ? item.attachment?.url : undefined;
            return (
              <li
                key={item.key}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-surface p-2.5',
                  item.status === 'error' ? 'border-danger/40' : 'border-line',
                )}
              >
                {preview ? (
                  <img src={preview} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <AttachmentIcon kind={item.kind} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p
                    className={cn(
                      'flex items-center gap-1 truncate text-xs',
                      item.status === 'error' ? 'text-danger' : 'text-ink-muted',
                    )}
                  >
                    {item.status === 'done' && item.isNew && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />}
                    <span className="truncate">{statusText(item)}</span>
                  </p>
                  {item.status === 'uploading' && (
                    <div
                      role="progressbar"
                      aria-label={`Subiendo ${item.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.progress}
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-100"
                    >
                      <div className="h-full rounded-full bg-primary-600 transition-[width] duration-150" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
                {item.status === 'error' && item.file && (
                  <button
                    type="button"
                    onClick={() => onRetry(item.key)}
                    aria-label={`Reintentar subir ${item.name}`}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-100 md:h-9 md:w-9"
                  >
                    <RotateCw className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.key)}
                  aria-label={item.status === 'uploading' ? `Cancelar subida de ${item.name}` : `Quitar ${item.name}`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-danger/10 hover:text-danger md:h-9 md:w-9"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
