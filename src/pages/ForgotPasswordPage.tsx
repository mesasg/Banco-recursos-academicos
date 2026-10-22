import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Mail } from 'lucide-react';
import { Button, buttonClasses } from '@/components/Button';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { authService, errorMessage } from '@/services';
import { validateEmail } from '@/utils/validation';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateEmail(email);
    setError(validation);
    if (validation) return;
    setSending(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card w-full max-w-md px-5 py-8 sm:px-8">
      <div className="flex justify-center">
        <Logo tone="dark" />
      </div>

      {sent ? (
        <div className="mt-6 text-center" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Si <strong className="text-ink">{email.trim()}</strong> está registrado, te enviamos un enlace para crear una
            contraseña nueva. Puede tardar unos minutos.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-center text-2xl font-semibold text-ink">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-center text-sm text-ink-muted">
            Escribe tu correo y te enviaremos un enlace para restablecerla.
          </p>
          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              startIcon={<Mail className="h-4 w-4" />}
              required
            />
            <Button type="submit" size="lg" fullWidth loading={sending} loadingLabel="Enviando…">
              Enviar enlace
            </Button>
          </form>
        </>
      )}

      <Link to="/login" className={buttonClasses({ variant: 'ghost', fullWidth: true, className: 'mt-4' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
