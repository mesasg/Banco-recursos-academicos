import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { buttonClasses } from '@/components/Button';
import { Logo } from '@/components/Logo';

/**
 * Vista temporal de registro. El alta de estudiantes depende de la validación
 * del correo institucional que hará el backend (Supabase Auth), por eso aquí
 * solo se explica el proceso.
 */
export function RegisterPage() {
  return (
    <div className="card w-full max-w-md px-5 py-8 text-center sm:px-8">
      <div className="flex justify-center">
        <Logo tone="dark" />
      </div>
      <span className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <GraduationCap className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Crear cuenta</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        El registro se hace con tu correo institucional de la Facultad de Ingeniería. Te enviaremos un enlace para
        confirmar que eres estudiante y elegir tu contraseña.
      </p>
      <div className="mt-5 rounded-lg bg-primary-50 p-4 text-left text-sm text-ink">
        <p className="font-semibold">Mientras habilitamos el registro</p>
        <p className="mt-1 text-ink-muted">
          Puedes explorar la plataforma con la cuenta de prueba que aparece en la pantalla de inicio de sesión.
        </p>
      </div>
      <Link to="/login" className={buttonClasses({ variant: 'primary', fullWidth: true, size: 'lg', className: 'mt-6' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
