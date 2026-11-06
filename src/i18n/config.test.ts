import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES, isLocale } from './config';

describe('locale metadata', () => {
  it('defaults to Arabic', () => {
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  it('marks Arabic as RTL and the others as LTR', () => {
    expect(LOCALES.ar.dir).toBe('rtl');
    expect(LOCALES.fr.dir).toBe('ltr');
    expect(LOCALES.en.dir).toBe('ltr');
  });

  it('guards unknown locale values', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('es')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
