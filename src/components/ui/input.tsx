import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

const control =
  'w-full rounded-xl border border-border bg-surface-3/70 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors duration-[var(--duration-quick)] ease-out hover:border-border-strong focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-fg-muted">
        {label}
        {required ? <span className="ms-1 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(control, invalid && 'border-danger focus:border-danger', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(control, 'resize-y', invalid && 'border-danger', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(control, 'appearance-none', invalid && 'border-danger', className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export interface TextFieldProps extends InputProps {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, id, required, ...props }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <Input id={inputId} invalid={Boolean(error)} required={required} {...props} />
    </Field>
  );
}
