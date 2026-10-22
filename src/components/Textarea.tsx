import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/text';
import { controlClasses, describedBy, Field } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, showCount, className, id, maxLength, value, required, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const count = showCount && maxLength ? { value: String(value ?? '').length, max: maxLength } : undefined;

  return (
    <Field id={textareaId} label={label} required={required} hint={hint} error={error} count={count}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, { hint, error, count })}
        className={cn(controlClasses(Boolean(error)), 'resize-y py-2.5 leading-relaxed', className)}
        {...rest}
      />
    </Field>
  );
});
