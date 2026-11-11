import { SUPPORTED_LOCALES, LOCALES, type Locale } from '@/i18n/config';
import { changeLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language) as Locale;

  return (
    <>
      {/* On phones the three buttons squeeze the page title, so the compact
          native select takes their place below the sm breakpoint. */}
      <select
        aria-label={t('common.language')}
        value={current}
        onChange={(event) => void changeLanguage(event.target.value as Locale)}
        className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs font-semibold text-fg sm:hidden"
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={LOCALES[locale].code}>
            {LOCALES[locale].label}
          </option>
        ))}
      </select>

      <div
        role="group"
        aria-label={t('common.language')}
        className="hidden items-center gap-0.5 rounded-xl border border-border bg-surface-2 p-1 sm:flex"
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const active = current === locale;
          return (
            <button
              key={locale}
              type="button"
              lang={LOCALES[locale].code}
              aria-pressed={active}
              title={LOCALES[locale].label}
              onClick={() => void changeLanguage(locale)}
              className={cn(
                'rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors duration-150 ease-out sm:px-2.5 sm:text-xs',
                active
                  ? 'bg-accent text-accent-contrast'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              {LOCALES[locale].label}
            </button>
          );
        })}
      </div>
    </>
  );
}
