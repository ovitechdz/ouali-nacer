export const LOCALES = {
  ar: { code: 'ar', dir: 'rtl', label: 'العربية', numberSystem: 'latn' },
  fr: { code: 'fr', dir: 'ltr', label: 'Français', numberSystem: 'latn' },
  en: { code: 'en', dir: 'ltr', label: 'English', numberSystem: 'latn' },
} as const;

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = 'ar';
export const LOCALE_STORAGE_KEY = 'ovitech-language';
export const SUPPORTED_LOCALES = Object.keys(LOCALES) as Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}
