import { beforeAll, describe, expect, it } from 'vitest';

import { changeLanguage, i18n, initI18n, loadLocale } from './index';

beforeAll(async () => {
  if (!i18n.isInitialized) await initI18n();
});

describe('i18n bootstrap', () => {
  it('boots in Arabic and sets an RTL document', async () => {
    await changeLanguage('ar');
    expect(i18n.resolvedLanguage).toBe('ar');
    expect(i18n.t('nav.team')).toBe('الفريق');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('lazy-loads French and switches direction', async () => {
    await changeLanguage('fr');
    expect(i18n.resolvedLanguage).toBe('fr');
    expect(i18n.t('nav.team')).toBe('Équipe');
    expect(i18n.hasResourceBundle('fr', 'translation')).toBe(true);
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.localStorage.getItem('ovitech-language')).toBe('fr');
  });

  it('lazy-loads English', async () => {
    await loadLocale('en');
    await changeLanguage('en');
    expect(i18n.t('nav.team')).toBe('Team');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('returns to Arabic', async () => {
    await changeLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
