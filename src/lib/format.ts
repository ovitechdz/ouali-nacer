import type { Locale } from '@/i18n/config';

const NUMBER_LOCALE: Record<Locale, string> = {
  ar: 'ar-DZ-u-nu-latn',
  fr: 'fr-DZ',
  en: 'en-GB',
};

function resolved(locale: string): string {
  return NUMBER_LOCALE[locale as Locale] ?? NUMBER_LOCALE.ar;
}

export function formatNumber(value: number, locale: string, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(resolved(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCurrency(value: number, locale: string): string {
  if (!Number.isFinite(value)) return '—';
  return `${formatNumber(Math.round(value), locale)} DZD`;
}

export function formatPercent(value: number, locale: string, digits = 0): string {
  return `${formatNumber(value, locale, digits)} %`;
}

export function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(resolved(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(resolved(locale), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function relativeDays(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

/** Keeps both ends of a long label so the farm name stays recognisable. */
export function middleTruncate(value: string, max = 32): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  if (max < 5) return chars.slice(0, max).join('');
  const head = Math.ceil((max - 1) * 0.65);
  const tail = max - 1 - head;
  return `${chars.slice(0, head).join('')}…${chars.slice(-tail).join('')}`;
}
