import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Eye, EyeOff, LogOut, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { useToast } from '@/components/Toast';
import { MAX_AVATAR_SIZE_MB } from '@/config';
import { useAuth, useCurrentUser } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { authService, errorMessage, userService } from '@/services';
import { validateNewPassword } from '@/utils/validation';

function SettingsCard({ title, description, children, tone }: { title: string; description?: string; children: ReactNode; tone?: 'danger' }) {
  const id = `settings-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={id} className={tone === 'danger' ? 'card border-danger/40 p-4 md:p-6' : 'card p-4 md:p-6'}>
      <h2 id={id} className={tone === 'danger' ? 'text-base font-semibold text-danger' : 'text-base font-semibold text-ink'}>
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ---------- Perfil ---------- */

function ProfileForm() {
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const { careers } = useCatalog();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [careerId, setCareerId] = useState(user.careerId);
  // undefined = sin cambios · null = quitar foto · File = foto nueva
  const [avatarFile, setAvatarFile] = useState<File | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(user.avatarUrl);
  const [errors, setErrors] = useState<{ name?: string; avatar?: string }>({});
  const [saving, setSaving] = useState(false);

  // Libera la URL temporal de la vista previa.
  useEffect(() => {
    if (!preview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const dirty = name.trim() !== user.name || careerId !== user.careerId || avatarFile !== undefined;

  const onPickAvatar = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setErrors((e) => ({ ...e, avatar: 'La foto debe ser PNG o JPG.' }));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, avatar: `La foto no puede superar ${MAX_AVATAR_SIZE_MB} MB.` }));
      return;
    }
    setErrors((e) => ({ ...e, avatar: undefined }));
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    const nameError = trimmed.length < 3 ? 'Escribe tu nombre completo (mínimo 3 caracteres).' : undefined;
    setErrors((e) => ({ ...e, name: nameError }));
    if (nameError) return;

    setSaving(true);
    try {
      const updated = await userService.updateProfile({ name: trimmed, careerId, avatarFile });
      setUser(updated);
      setAvatarFile(undefined);
      setPreview(updated.avatarUrl);
      toast.success('Tu perfil se actualizó.');
    } catch (e) {
      toast.error(errorMessage(e, 'No pudimos guardar tu perfil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard title="Perfil" description="Así te ven los demás estudiantes en tus publicaciones.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name || user.name} src={preview} size="lg" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leftIcon={<Camera className="h-4 w-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
                Cambiar foto
              </Button>
              {preview && (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarFile(null);
                    setPreview(undefined);
                  }}
                >
                  Quitar foto
                </Button>
              )}
            </div>
            <p className={errors.avatar ? 'text-xs font-medium text-danger' : 'text-xs text-ink-muted'} role={errors.avatar ? 'alert' : undefined}>
              {errors.avatar ?? `PNG o JPG, máximo ${MAX_AVATAR_SIZE_MB} MB.`}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              onPickAvatar(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre completo" required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
          <Select label="Carrera" required value={careerId} onChange={(e) => setCareerId(e.target.value)} options={careers.map((c) => ({ value: c.id, label: c.name }))} />
        </div>

        <Input label="Correo electrónico" value={user.email} readOnly hint="El correo de tu cuenta no se puede cambiar." />

        <div className="flex justify-end">
          <Button type="submit" loading={saving} loadingLabel="Guardando…" disabled={!dirty}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

/* ---------- Contraseña ---------- */

function PasswordForm() {
  const user = useCurrentUser();
  const toast = useToast();
  const [values, setValues] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = {
      current: values.current ? undefined : 'Escribe tu contraseña actual.',
      next: validateNewPassword(values.next) ?? (values.next === values.current ? 'Debe ser distinta a la actual.' : undefined),
      confirm: values.confirm === values.next ? undefined : 'Las contraseñas no coinciden.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSaving(true);
    try {
      await authService.changePassword(values.current, values.next);
      setValues({ current: '', next: '', confirm: '' });
      toast.success('Tu contraseña se cambió correctamente.');
    } catch (e) {
      setErrors({ current: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
      aria-pressed={show}
      className="inline-flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink"
    >
      {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
    </button>
  );
  const type = show ? 'text' : 'password';

  return (
    <SettingsCard title="Contraseña" description="Usa al menos 8 caracteres combinando letras y números.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Campo de usuario oculto para que los gestores de contraseñas asocien la cuenta. */}
        <input type="text" autoComplete="username" value={user.email} readOnly hidden />
        <Input label="Contraseña actual" type={type} autoComplete="current-password" value={values.current} onChange={set('current')} error={errors.current} endAdornment={toggle} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nueva contraseña" type={type} autoComplete="new-password" value={values.next} onChange={set('next')} error={errors.next} />
          <Input label="Confirmar nueva contraseña" type={type} autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving} loadingLabel="Actualizando…" disabled={!values.current || !values.next || !values.confirm}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

/* ---------- Sesión y zona de peligro ---------- */

function SessionAndDanger() {
  const { logout, clearSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    toast.info('Cerraste sesión. ¡Hasta pronto!');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      setConfirmDelete(false);
      clearSession();
      navigate('/login', { replace: true });
      toast.success('Tu cuenta y tus publicaciones fueron eliminadas.');
    } catch (e) {
      toast.error(errorMessage(e, 'No pudimos eliminar tu cuenta.'));
      setDeleting(false);
    }
  };

  return (
    <>
      <SettingsCard title="Sesión" description="Cierra la sesión en este dispositivo.">
        <Button variant="secondary" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" aria-hidden />}>
          Cerrar sesión
        </Button>
      </SettingsCard>

      <SettingsCard
        title="Zona de peligro"
        tone="danger"
        description="Eliminar tu cuenta borra tu perfil, tus publicaciones y tus favoritos. Esta acción no se puede deshacer."
      >
        <Button variant="danger" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}>
          Eliminar cuenta
        </Button>
      </SettingsCard>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar tu cuenta definitivamente?"
        message="Se borrarán tu perfil, todas tus publicaciones con sus adjuntos y tu lista de favoritos. No podrás recuperarlos."
        confirmLabel="Sí, eliminar mi cuenta"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export function SettingsTab() {
  return (
    <div className="flex flex-col gap-4">
      <ProfileForm />
      <PasswordForm />
      <SessionAndDanger />
    </div>
  );
}
