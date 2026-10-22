import { Outlet } from 'react-router-dom';
import { BookOpenCheck, MessagesSquare, Star } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { APP_NAME } from '@/config';

const highlights = [
  { icon: BookOpenCheck, text: 'Apuntes, diagramas, PDFs y enlaces para cada estilo de aprendizaje.' },
  { icon: MessagesSquare, text: 'Foros por materia para resolver dudas entre compañeros.' },
  { icon: Star, text: 'Valoraciones que te muestran qué recursos sí sirven.' },
];

/** Pantallas sin sesión: tarjeta centrada y, en desktop, un panel ilustrativo de marca. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <section
        aria-label={`Qué es ${APP_NAME}`}
        className="on-brand relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-primary-500 p-10 text-white lg:flex xl:p-14"
      >
        <Logo />
        <div className="relative z-10">
          {/* Texto grande (≥24 px) en blanco sobre primary-500: cumple AA para texto grande. */}
          <p className="text-3xl font-semibold leading-tight xl:text-4xl">
            Aprende con lo que comparten tus compañeros.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-xl bg-primary-700 p-4 text-[15px] leading-snug">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-lg font-semibold">Facultad de Ingeniería</p>

        {/* Decoración */}
        <svg className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-20" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="96" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="100" cy="100" r="64" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="100" cy="100" r="32" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
        <svg className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 opacity-15" viewBox="0 0 100 100" aria-hidden>
          <rect x="10" y="10" width="80" height="80" rx="12" fill="none" stroke="#fff" strokeWidth="2" transform="rotate(12 50 50)" />
        </svg>
      </section>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
