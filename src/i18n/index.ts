import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from './config';

type Catalog = Record<string, string>;

const lazyLoaders: Record<Exclude<Locale, 'ar'>, () => Promise<{ default: Catalog }>> = {
  fr: () => import('./locales/fr.json'),
  en: () => import('./locales/en.json'),
};

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function applyDocumentLocale(locale: Locale): void {
  const meta = LOCALES[locale];
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.documentElement.dataset.locale = locale;
}

export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === 'ar' || i18n.hasResourceBundle(locale, 'translation')) return;
  const catalog = await lazyLoaders[locale]();
  i18n.addResourceBundle(locale, 'translation', catalog.default, true, true);
}

export async function changeLanguage(locale: Locale): Promise<void> {
  await loadLocale(locale);
  await i18n.changeLanguage(locale);
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // A blocked localStorage must never break the language switch.
  }
}

export async function initI18n(): Promise<typeof i18n> {
  const initial = readStoredLocale();
  const resources: Record<string, { translation: Catalog }> = { ar: { translation: ar } };

  if (initial !== 'ar') {
    const catalog = await lazyLoaders[initial]();
    resources[initial] = { translation: catalog.default };
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  applyDocumentLocale(initial);
  i18n.on('languageChanged', (locale) => {
    if (isLocale(locale)) applyDocumentLocale(locale);
  });

  return i18n;
}

export { i18n };
