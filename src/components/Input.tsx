import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/text';
import { controlClasses, describedBy, Field } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  /** Muestra contador de caracteres usando maxLength como tope. */
  showCount?: boolean;
  /** Ícono a la izquierda (decorativo). */
  startIcon?: ReactNode;
  /** Botón o ícono a la derecha (p. ej. mostrar contraseña). */
  endAdornment?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, hint, error, showCount, startIcon, endAdornment, containerClassName, className, id, maxLength, value, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const count = showCount && maxLength ? { value: String(value ?? '').length, max: maxLength } : undefined;

  return (
    <Field
      id={inputId}
      label={label}
      hideLabel={hideLabel}
      required={required}
      hint={hint}
      error={error}
      count={count}
      className={containerClassName}
    >
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted" aria-hidden>
            {startIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error, count })}
          className={cn(controlClasses(Boolean(error)), 'h-11 read-only:bg-canvas', Boolean(startIcon) && 'pl-10', Boolean(endAdornment) && 'pr-12', className)}
          {...rest}
        />
        {endAdornment && <div className="absolute inset-y-0 right-0 flex items-center">{endAdornment}</div>}
      </div>
    </Field>
  );
});
