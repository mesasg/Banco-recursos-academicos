import { useId, useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { ACCEPTED_FILE_EXTENSIONS, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/config';
import { cn } from '@/utils/text';
import { Button } from './Button';

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  /** Mensajes de los archivos rechazados (tipo o tamaño). */
  onReject: (messages: string[]) => void;
  disabled?: boolean;
  error?: string;
  describedById?: string;
}

/** Zona para arrastrar archivos + botón "Seleccionar archivos". Valida tipo y tamaño. */
export function FileDropzone({ onFiles, onReject, disabled, error, describedById }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();

  const handle = (list: FileList | null) => {
    if (!list || disabled) return;
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(list)) {
      if (!ACCEPTED_FILE_TYPES[file.type]) rejected.push(`"${file.name}" no es PDF, PNG ni JPG.`);
      else if (file.size > MAX_FILE_SIZE_BYTES) rejected.push(`"${file.name}" supera el límite de ${MAX_FILE_SIZE_MB} MB.`);
      else accepted.push(file);
    }
    if (accepted.length) onFiles(accepted);
    if (rejected.length) onReject(rejected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handle(event.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
        dragging ? 'border-primary-600 bg-primary-100' : error ? 'border-danger/60 bg-surface' : 'border-line bg-primary-50',
        disabled && 'opacity-60',
      )}
    >
      <UploadCloud className={cn('h-9 w-9', dragging ? 'text-primary-700' : 'text-primary-600')} aria-hidden />
      <p className="mt-2 text-sm font-medium text-ink">
        <span className="hidden md:inline">Arrastra tus archivos aquí o </span>
        <span className="md:hidden">Sube tus archivos </span>
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-describedby={[hintId, describedById].filter(Boolean).join(' ')}
      >
        Seleccionar archivos
      </Button>
      <p id={hintId} className="mt-2 text-xs text-ink-muted">
        PDF, PNG o JPG · máximo {MAX_FILE_SIZE_MB} MB por archivo
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
