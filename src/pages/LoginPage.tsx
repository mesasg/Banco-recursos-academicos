import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { APP_NAME, APP_TAGLINE } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/mocks/users';
import { errorMessage } from '@/services';
import { validateEmail } from '@/utils/validation';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = (): FieldErrors => ({
    email: validateEmail(email),
    password: password ? undefined : 'Escribe tu contraseña.',
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'No pudimos iniciar sesión. Intenta de nuevo.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="card px-5 py-8 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Logo tone="dark" />
          <h1 className="mt-5 text-2xl font-semibold text-ink">Inicia sesión</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {APP_TAGLINE}: comparte y encuentra recursos de tus materias en {APP_NAME}.
          </p>
        </div>

        {formError && (
          <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            ref={emailRef}
            label="Correo electrónico"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="tu.correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && setErrors((p) => ({ ...p, email: validateEmail(email) }))}
            error={errors.email}
            startIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            ref={passwordRef}
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-primary-600"
              />
              Recordarme
            </label>
            <Link to="/recuperar" className="inline-flex min-h-11 items-center rounded text-sm font-semibold text-primary-700 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting} loadingLabel="Iniciando sesión…">
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-primary-700 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>

      {/* Ayuda del modo mock: se elimina al conectar el backend. */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-surface p-3 text-xs text-ink-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden />
        <p>
          <span className="font-semibold text-ink">Cuenta de prueba:</span> {DEMO_EMAIL} · contraseña {DEMO_PASSWORD}.{' '}
          <button
            type="button"
            className="font-semibold text-primary-700 underline-offset-2 hover:underline"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setErrors({});
            }}
          >
            Usar estos datos
          </button>
        </p>
      </div>
    </div>
  );
}
