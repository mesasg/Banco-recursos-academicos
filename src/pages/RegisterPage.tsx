import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { Select } from '@/components/Select';
import { useToast } from '@/components/Toast';
import { APP_NAME } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { errorMessage } from '@/services';
import { validateEmail, validateNewPassword } from '@/utils/validation';

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  careerId: string;
  password: string;
}

type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  return {
    firstName: v.firstName.trim() ? undefined : 'Escribe tu nombre.',
    lastName: v.lastName.trim() ? undefined : 'Escribe tu apellido.',
    email: validateEmail(v.email),
    careerId: v.careerId ? undefined : 'Elige la carrera que estudias.',
    password: validateNewPassword(v.password),
  };
}

const FIELD_ORDER: Array<keyof Values> = ['firstName', 'lastName', 'email', 'careerId', 'password'];

export function RegisterPage() {
  const { register } = useAuth();
  const { careers } = useCatalog();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState<Values>({ firstName: '', lastName: '', email: '', careerId: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /** Valida un campo al salir de él, solo si ya tiene algo escrito. */
  const blur = (key: keyof Values) => () => {
    if (values[key]) setErrors((prev) => ({ ...prev, [key]: validate(values)[key] }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    setFormError(null);
    const firstInvalid = FIELD_ORDER.find((k) => next[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        careerId: values.careerId,
        password: values.password,
      });
      navigate('/', { replace: true });
      toast.success(`¡Te damos la bienvenida a ${APP_NAME}, ${user.name.split(' ')[0]}!`);
    } catch (error) {
      setFormError(errorMessage(error, 'No pudimos crear tu cuenta. Intenta de nuevo.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="card px-5 py-8 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Logo tone="dark" />
          <h1 className="mt-5 text-2xl font-semibold text-ink">Crear cuenta</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Únete para compartir y encontrar recursos de tus materias.</p>
        </div>

        {formError && (
          <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </div>
        )}

        <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="firstName"
              label="Nombre"
              autoComplete="given-name"
              value={values.firstName}
              maxLength={40}
              onChange={set('firstName')}
              onBlur={blur('firstName')}
              error={errors.firstName}
              required
            />
            <Input
              name="lastName"
              label="Apellido"
              autoComplete="family-name"
              value={values.lastName}
              maxLength={40}
              onChange={set('lastName')}
              onBlur={blur('lastName')}
              error={errors.lastName}
              required
            />
          </div>

          <Input
            name="email"
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu.correo@ejemplo.com"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            error={errors.email}
            startIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Select
            name="careerId"
            label="¿Qué carrera estudias?"
            value={values.careerId}
            placeholder="Selecciona tu carrera"
            options={careers.map((c) => ({ value: c.id, label: c.name }))}
            onChange={set('careerId')}
            error={errors.careerId}
            required
          />

          <Input
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            onBlur={blur('password')}
            error={errors.password}
            hint="Al menos 8 caracteres, con letras y números."
            startIcon={<Lock className="h-4 w-4" />}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="inline-flex h-11 w-11 items-center justify-center rounded-r-lg text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            }
          />

          <Button type="submit" size="lg" fullWidth loading={submitting} loadingLabel="Creando cuenta…" className="mt-1">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
