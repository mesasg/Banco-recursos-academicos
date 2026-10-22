import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { Textarea } from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { useCatalog } from '@/context/CatalogContext';
import { errorMessage, forumService } from '@/services';
import type { ForumThread } from '@/types';

const TITLE_MIN = 10;
const TITLE_MAX = 150;
const BODY_MIN = 20;
const BODY_MAX = 2000;

interface NewThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (thread: ForumThread) => void;
  /** Foro de una materia: la pregunta va ahí. */
  subjectId?: string | null;
  /** Foro de una carrera: se elige la materia entre las de la carrera. */
  careerId?: string | null;
}

export function NewThreadDialog({ open, onClose, onCreated, subjectId, careerId }: NewThreadDialogProps) {
  const { findCareer, findSubject } = useCatalog();
  const toast = useToast();
  const fixedSubject = findSubject(subjectId);
  const career = findCareer(fixedSubject?.careerId ?? careerId);

  const [values, setValues] = useState({ subjectId: '', title: '', body: '' });
  const [touched, setTouched] = useState({ subjectId: false, title: false, body: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Cada vez que se abre, empieza limpio con la materia del foro.
  useEffect(() => {
    if (!open) return;
    setValues({ subjectId: fixedSubject?.id ?? '', title: '', body: '' });
    setTouched({ subjectId: false, title: false, body: false });
    setSubmitError(undefined);
  }, [open, fixedSubject?.id]);

  const errors = {
    subjectId: values.subjectId ? undefined : 'Elige la materia de tu pregunta.',
    title: values.title.trim().length < TITLE_MIN ? `Resume tu duda en al menos ${TITLE_MIN} caracteres.` : undefined,
    body: values.body.trim().length < BODY_MIN ? `Cuenta un poco más (mínimo ${BODY_MIN} caracteres).` : undefined,
  };
  const isValid = !errors.subjectId && !errors.title && !errors.body;
  const dirty = Boolean(values.title.trim() || values.body.trim());

  const requestClose = () => {
    if (submitting) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ subjectId: true, title: true, body: true });
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const thread = await forumService.createThread(values);
      toast.success('Tu pregunta ya está en el foro.');
      onCreated(thread);
    } catch (e) {
      setSubmitError(errorMessage(e, 'No pudimos publicar tu pregunta.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title="Hacer una pregunta"
        description="Explica qué intentaste y en qué parte te trabaste: así es más fácil que te ayuden."
        size="lg"
        fullScreenOnMobile
        initialFocusRef={titleRef}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={submitting} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              type="submit"
              form="thread-form"
              disabled={!isValid}
              loading={submitting}
              loadingLabel="Publicando…"
              className="flex-1 sm:flex-none"
            >
              Publicar pregunta
            </Button>
          </>
        }
      >
        <form id="thread-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {submitError}
            </div>
          )}

          {fixedSubject ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-muted">Se publicará en el foro de:</span>
              {career && <Chip tone="neutral">{career.name}</Chip>}
              <Chip>{fixedSubject.name}</Chip>
            </div>
          ) : (
            <Select
              label="Materia"
              required
              value={values.subjectId}
              placeholder="Selecciona la materia"
              options={(career?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
              onChange={(e) => {
                setValues((v) => ({ ...v, subjectId: e.target.value }));
                setTouched((t) => ({ ...t, subjectId: true }));
              }}
              hint={career ? `Materias de ${career.name}` : undefined}
              error={touched.subjectId ? errors.subjectId : undefined}
            />
          )}

          <Input
            ref={titleRef}
            label="Pregunta"
            required
            value={values.title}
            maxLength={TITLE_MAX}
            showCount
            placeholder="Ej.: ¿Cuándo conviene usar coordenadas polares?"
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            error={touched.title ? errors.title : undefined}
          />

          <Textarea
            label="Detalles"
            required
            value={values.body}
            maxLength={BODY_MAX}
            showCount
            rows={7}
            placeholder="Describe el ejercicio, lo que ya intentaste y el resultado que obtuviste."
            onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, body: true }))}
            error={touched.body ? errors.body : undefined}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar la pregunta?"
        message="Lo que escribiste se perderá."
        confirmLabel="Descartar"
        cancelLabel="Seguir escribiendo"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
