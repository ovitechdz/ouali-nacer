import { describe, expect, it } from 'vitest';

import { changeLanguage } from '@/i18n';
import { LOCALES, type Locale } from '@/i18n/config';
import { describeViolations, runAxe } from '@/test/axe';
import { registerFixture, renderPage } from '@/test/interactions-harness';
import { ROUTES } from '@/test/routes';

registerFixture();

/** Arabic RTL and French LTR: the two first-class product locales. */
const CASES: ReadonlyArray<{ locale: Locale; code: string; dir: string }> = [
  { locale: 'ar', code: LOCALES.ar.code, dir: LOCALES.ar.dir },
  { locale: 'fr', code: LOCALES.fr.code, dir: LOCALES.fr.dir },
];

describe.each(CASES)('axe-core audit — $locale ($dir)', ({ locale, code, dir }) => {
  it.each(ROUTES)(
    '$path',
    async (route) => {
      await changeLanguage(locale);
      expect(document.documentElement.lang).toBe(code);
      expect(document.documentElement.dir).toBe(dir);

      const container = await renderPage(route.path, route.page, route.routePath);
      const { violations } = await runAxe(container);
      expect(violations, describeViolations(violations)).toHaveLength(0);
      // Under full CI coverage a single route can exceed the 20 s suite default;
      // a timeout here used to leave axe busy and cascade into every later route.
    },
    120_000,
  );
});
