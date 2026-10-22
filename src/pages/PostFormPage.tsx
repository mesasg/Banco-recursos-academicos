import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { Textarea } from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { POST_DESCRIPTION_MAX, POST_TITLE_MAX } from '@/config';
import { useCurrentUser } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { useDataSync } from '@/context/DataSyncContext';
import { AttachmentsField, type FormAttachment } from '@/features/posts/AttachmentsField';
import { useDeletePost } from '@/features/posts/useDeletePost';
import type { PostFormLocationState } from '@/features/posts/usePostFormNavigation';
import { errorMessage, postService } from '@/services';
import type { Attachment } from '@/types';

const TITLE_MIN = 5;

interface Values {
  title: string;
  description: string;
  careerId: string;
  subjectId: string;
}

const emptyValues: Values = { title: '', description: '', careerId: '', subjectId: '' };

function fromAttachment(a: Attachment): FormAttachment {
  return { key: a.id, kind: a.kind, name: a.name, sizeBytes: a.sizeBytes, status: 'done', progress: 100, attachment: a };
}

function linkName(url: string): string {
  const { hostname, pathname } = new URL(url);
  const path = pathname === '/' ? '' : pathname;
  const name = `${hostname.replace(/^www\./, '')}${path}`;
  return name.length > 60 ? `${name.slice(0, 57)}…` : name;
}

/**
 * Crear / editar publicación. Modal en tablet y desktop, pantalla completa en móvil.
 * Rutas: /publicar y /publicar/:postId/editar.
 */
export function PostFormPage() {
  const { postId } = useParams();
  const isEdit = Boolean(postId);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as PostFormLocationState | null;
  const user = useCurrentUser();
  const toast = useToast();
  const { careers, findCareer, findSubject, loading: catalogLoading } = useCatalog();
  const { invalidatePosts } = useDataSync();

  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string>();
  const [initial, setInitial] = useState<{ values: Values; attachmentIds: string[] }>({ values: emptyValues, attachmentIds: [] });
  const [values, setValues] = useState<Values>(emptyValues);
  const [items, setItems] = useState<FormAttachment[]>([]);
  const [touched, setTouched] = useState<Partial<Record<keyof Values | 'attachments', boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const uploads = useRef(new Map<string, AbortController>());

  /* ---------- Cerrar ---------- */

  const close = useCallback(() => {
    if (routeState?.backgroundLocation) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate, routeState]);

  const { requestDelete, dialog: deleteDialog } = useDeletePost(close);

  /* ---------- Carga inicial ---------- */

  // Editar: trae la publicación y verifica que sea del usuario.
  useEffect(() => {
    if (isEdit) {
      let active = true;
      setLoadStatus('loading');
      postService
        .getPost(postId!)
        .then((post) => {
          if (!active) return;
          if (post.author.id !== user.id) {
            setLoadError('Solo el autor puede editar esta publicación.');
            setLoadStatus('error');
            return;
          }
          const v = { title: post.title, description: post.description ?? '', careerId: post.career.id, subjectId: post.subject.id };
          setValues(v);
          setItems(post.attachments.map(fromAttachment));
          setInitial({ values: v, attachmentIds: post.attachments.map((a) => a.id) });
          setLoadStatus('ready');
        })
        .catch((e) => {
          if (!active) return;
          setLoadError(errorMessage(e, 'No pudimos cargar la publicación.'));
          setLoadStatus('error');
        });
      return () => {
        active = false;
      };
    }
    // Solo depende de la publicación que se edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Crear: espera el catálogo para sugerir la materia del filtro activo o la carrera del usuario.
  const createInitialized = useRef(false);
  useEffect(() => {
    if (isEdit || createInitialized.current || (catalogLoading && careers.length === 0)) return;
    createInitialized.current = true;
    const preset = findSubject(routeState?.presetSubjectId);
    const careerId = preset?.careerId ?? (findCareer(user.careerId) ? user.careerId : '');
    const v = { ...emptyValues, careerId, subjectId: preset?.id ?? '' };
    setValues(v);
    setInitial({ values: v, attachmentIds: [] });
    setLoadStatus('ready');
  }, [isEdit, catalogLoading, careers.length, findSubject, findCareer, routeState?.presetSubjectId, user.careerId]);

  // El modal se abre antes de que el formulario esté listo: el foco va al título al aparecer.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (loadStatus === 'ready') titleRef.current?.focus();
  }, [loadStatus]);

  // Al cerrar el formulario se cancelan las subidas pendientes.
  useEffect(() => {
    const controllers = uploads.current;
    return () => controllers.forEach((c) => c.abort());
  }, []);

  /* ---------- Validación ---------- */

  const doneAttachments = items.filter((i) => i.status === 'done' && i.attachment).map((i) => i.attachment!);
  const uploading = items.some((i) => i.status === 'uploading');

  const errors = useMemo(() => {
    const title = values.title.trim();
    return {
      title: !title ? 'Escribe un título.' : title.length < TITLE_MIN ? `Usa al menos ${TITLE_MIN} caracteres.` : undefined,
      description: values.description.length > POST_DESCRIPTION_MAX ? `Máximo ${POST_DESCRIPTION_MAX} caracteres.` : undefined,
      careerId: values.careerId ? undefined : 'Elige la carrera.',
      subjectId: values.subjectId ? undefined : 'Elige la materia.',
      attachments: doneAttachments.length ? undefined : 'Agrega al menos un archivo o enlace.',
    };
  }, [values, doneAttachments.length]);

  const isValid = Object.values(errors).every((e) => !e) && !uploading;
  const missing = [
    errors.title && 'título',
    (errors.careerId || errors.subjectId) && 'carrera y materia',
    errors.attachments && !uploading && 'un archivo o enlace',
  ].filter(Boolean);

  const dirty =
    loadStatus === 'ready' &&
    (JSON.stringify(values) !== JSON.stringify(initial.values) ||
      items.map((i) => i.key).join() !== initial.attachmentIds.join());

  // Aviso del navegador si recargas o cierras la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const requestClose = () => {
    if (submitting) return;
    if (dirty) setConfirmDiscard(true);
    else close();
  };

  /* ---------- Campos ---------- */

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onCareerChange = (careerId: string) => {
    const keepSubject = findSubject(values.subjectId)?.careerId === careerId;
    setValues((v) => ({ ...v, careerId, subjectId: keepSubject ? v.subjectId : '' }));
    setTouched((t) => ({ ...t, careerId: true }));
  };

  const updateItem = (key: string, patch: Partial<FormAttachment>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const startUpload = (key: string, file: File) => {
    const controller = new AbortController();
    uploads.current.set(key, controller);
    postService
      .uploadAttachment(file, (progress) => updateItem(key, { progress }), controller.signal)
      .then((attachment) => updateItem(key, { status: 'done', progress: 100, attachment }))
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        updateItem(key, { status: 'error', error: errorMessage(e, 'No se pudo subir') });
      })
      .finally(() => uploads.current.delete(key));
  };

  const addFiles = (files: File[]) => {
    const newItems: FormAttachment[] = files.map((file) => ({
      key: `upload-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      kind: file.type === 'application/pdf' ? 'pdf' : 'image',
      name: file.name,
      sizeBytes: file.size,
      status: 'uploading',
      progress: 0,
      file,
      isNew: true,
    }));
    setItems((list) => [...list, ...newItems]);
    setTouched((t) => ({ ...t, attachments: true }));
    newItems.forEach((item) => startUpload(item.key, item.file!));
  };

  const addLink = (url: string) => {
    const attachment: Attachment = { id: `link-${Date.now()}`, kind: 'link', name: linkName(url), url };
    setItems((list) => [...list, { ...fromAttachment(attachment), isNew: true }]);
    setTouched((t) => ({ ...t, attachments: true }));
  };

  const removeItem = (key: string) => {
    uploads.current.get(key)?.abort();
    setItems((list) => list.filter((i) => i.key !== key));
    setTouched((t) => ({ ...t, attachments: true }));
  };

  const retryItem = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item?.file) return;
    updateItem(key, { status: 'uploading', progress: 0, error: undefined });
    startUpload(key, item.file);
  };

  /* ---------- Guardar ---------- */

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ title: true, description: true, careerId: true, subjectId: true, attachments: true });
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError(undefined);
    const input = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      careerId: values.careerId,
      subjectId: values.subjectId,
      attachments: doneAttachments,
    };
    try {
      if (isEdit) await postService.updatePost(postId!, input);
      else await postService.createPost(input);
      toast.success(isEdit ? 'Cambios guardados.' : '¡Tu recurso ya está publicado!');
      invalidatePosts();
      close();
    } catch (e) {
      setSubmitError(errorMessage(e, 'No pudimos guardar la publicación.'));
      setSubmitting(false);
    }
  };

  /* ---------- Render ---------- */

  const career = findCareer(values.careerId);
  const subject = findSubject(values.subjectId);
  const show = (field: keyof typeof errors) => (touched[field] ? errors[field] : undefined);

  const footer =
    loadStatus === 'ready' ? (
      <>
        {missing.length > 0 && (
          <p className="w-full text-xs text-ink-muted sm:mr-auto sm:w-auto" id="post-form-missing">
            Falta: {missing.join(', ')}.
          </p>
        )}
        {uploading && (
          <p className="flex w-full items-center gap-1.5 text-xs text-ink-muted sm:mr-auto sm:w-auto">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Esperando a que terminen las subidas…
          </p>
        )}
        <Button variant="secondary" onClick={requestClose} disabled={submitting} className="flex-1 sm:flex-none">
          Cancelar
        </Button>
        <Button
          type="submit"
          form="post-form"
          disabled={!isValid}
          loading={submitting}
          loadingLabel={isEdit ? 'Guardando…' : 'Publicando…'}
          aria-describedby={missing.length ? 'post-form-missing' : undefined}
          className="flex-1 sm:flex-none"
        >
          {isEdit ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </>
    ) : undefined;

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isEdit ? 'Editar publicación' : 'Añadir recurso'}
        description={isEdit ? undefined : 'Comparte material para que otros estudiantes aprendan contigo.'}
        size="lg"
        fullScreenOnMobile
        footer={footer}
      >
        {loadStatus === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-16 text-ink-muted" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-primary-600" aria-hidden />
            <span className="text-sm">Cargando formulario…</span>
          </div>
        )}

        {loadStatus === 'error' && (
          <EmptyState
            illustration="error"
            title="No se puede editar"
            description={loadError}
            className="border-0 shadow-none"
            action={
              <Button variant="secondary" onClick={close}>
                Volver
              </Button>
            }
          />
        )}

        {loadStatus === 'ready' && (
          <form id="post-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            {submitError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {submitError}
              </div>
            )}

            <Input
              ref={titleRef}
              label="Título"
              required
              value={values.title}
              maxLength={POST_TITLE_MAX}
              showCount
              placeholder="Ej.: Resumen de árboles AVL con ejemplos"
              onChange={(e) => set('title', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              error={show('title')}
            />

            <Textarea
              label="Descripción breve"
              hint="Opcional. Cuenta qué incluye y para qué sirve."
              value={values.description}
              maxLength={POST_DESCRIPTION_MAX}
              showCount
              rows={3}
              onChange={(e) => set('description', e.target.value)}
              error={show('description')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Carrera"
                required
                value={values.careerId}
                placeholder="Selecciona una carrera"
                options={careers.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(e) => onCareerChange(e.target.value)}
                error={show('careerId')}
              />
              <Select
                label="Materia"
                required
                value={values.subjectId}
                placeholder={career ? 'Selecciona una materia' : 'Primero elige la carrera'}
                options={(career?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
                disabled={!career}
                onChange={(e) => {
                  set('subjectId', e.target.value);
                  setTouched((t) => ({ ...t, subjectId: true }));
                }}
                error={show('subjectId')}
              />
            </div>

            {(career || subject) && (
              <div className="-mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
                <span className="text-xs text-ink-muted">Se publicará en:</span>
                {career && <Chip tone="neutral">{career.name}</Chip>}
                {subject && <Chip>{subject.name}</Chip>}
              </div>
            )}

            <AttachmentsField
              items={items}
              onAddFiles={addFiles}
              onAddLink={addLink}
              onRemove={removeItem}
              onRetry={retryItem}
              error={show('attachments')}
            />

            {isEdit && (
              <section className="mt-2 rounded-xl border border-danger/30 p-4" aria-labelledby="danger-post">
                <h3 id="danger-post" className="text-sm font-semibold text-ink">
                  Eliminar publicación
                </h3>
                <p className="mt-1 text-sm text-ink-muted">Se borrará junto con sus adjuntos, valoraciones y respuestas.</p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-3"
                  leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
                  onClick={() => requestDelete({ id: postId!, title: initial.values.title })}
                >
                  Eliminar publicación
                </Button>
              </section>
            )}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar los cambios?"
        message="Tienes cambios sin guardar. Si sales ahora, se perderán."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        onConfirm={() => {
          setConfirmDiscard(false);
          close();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
      {deleteDialog}
    </>
  );
}
