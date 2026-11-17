import { cn } from '@/lib/cn';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('-mx-1 flex flex-wrap gap-2 px-1 pb-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-[var(--duration-quick)] ease-out',
              active
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs leading-none tabular-nums',
                  active ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-fg-subtle',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
