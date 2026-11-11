import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'warn' | 'danger' | 'info';

const TONES: Record<Tone, { value: string; icon: string; bar: string }> = {
  neutral: { value: 'text-fg-strong', icon: 'bg-surface-3 text-fg-muted', bar: 'bg-fg-muted' },
  accent: { value: 'text-success', icon: 'bg-accent/10 text-accent', bar: 'bg-accent' },
  warn: { value: 'text-warn', icon: 'bg-warn/10 text-warn', bar: 'bg-warn' },
  danger: { value: 'text-danger', icon: 'bg-danger/10 text-danger', bar: 'bg-danger' },
  info: { value: 'text-info', icon: 'bg-info/10 text-info', bar: 'bg-info' },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-2 p-4 shadow-sm shadow-surface/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
          {label}
        </span>
        {Icon ? (
          <span
            className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TONES[tone].icon)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 flex items-baseline gap-1 text-2xl font-bold tabular-nums',
          TONES[tone].value,
        )}
      >
        <span>{value}</span>
        {unit ? <span className="text-xs font-medium text-fg-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-fg-muted">{hint}</p> : null}
    </div>
  );
}

export interface GaugeProps {
  label: string;
  value: number;
  max?: number;
  display: string;
  hint?: string;
  tone?: Tone;
}

/** Accessible ring gauge. The numeric value is always printed as text. */
export function Gauge({ label, value, max = 100, display, hint, tone = 'accent' }: GaugeProps) {
  const safeMax = max <= 0 ? 100 : max;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const stroke = TONES[tone].bar.replace('bg-', 'text-');

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-4">
      <div className="relative size-20 shrink-0">
        <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="8"
            className="text-surface-3"
            stroke="currentColor"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference * ratio} ${circumference}`}
            className={stroke}
            stroke="currentColor"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums text-fg-strong">
          {Math.round(ratio * 100)} %
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-muted">{label}</p>
        <p className="mt-1 text-lg font-bold tabular-nums text-fg-strong">{display}</p>
        {hint ? <p className="mt-0.5 text-xs text-fg-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  display?: string;
  tone?: Tone;
}

export function ProgressBar({
  label,
  value,
  max = 100,
  display,
  tone = 'accent',
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-fg">
          {display ?? `${Math.round(ratio * 100)} %`}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div
          className={cn('h-full rounded-full', TONES[tone].bar)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
