# OVITECH

منصّة لإدارة مزرعة أغنام: عربية أولاً، تعمل دون اتصال، وتُثبَّت كتطبيق ويب تقدّمي.

## المتطلبات

Node.js 22 (النسخة في `.nvmrc`) وnpm 10 أو أحدث.

## التثبيت والتشغيل

```bash
npm ci
npm run dev
```

## الاختبارات والبناء

`npm run test` يشغّل Vitest مع تغطية v8 والعتبات العامة، و`npm run build` يتحقّق من الأنواع
ثم يبني الإنتاج في `dist/` مع عامل الخدمة.

## بوابات الجودة

`npm run ci` سلسلة واحدة: التنسيق، ESLint وحدود الطبقات، الأنواع، الاختبارات والتغطية،
`check:i18n`، `check:rtl`، `check:secrets`، `check:deps`، `check:seed`، `check:domain`،
`check:text-size`، البناء، `audit:bundle`، `audit:precache`، `check:origins`.
CI يشغّل `npm ci` ثم `npm run ci` نفسها، فلا قائمة ثانية تتباعد عنها.

## خريطة المجلدات

- `src/app` — الراوتر ومزوّدات السياق وبوّابة المزرعة
- `src/pages` — شاشات المسارات
- `src/components` — عناصر الواجهة المشتركة
- `src/domain` — الأنواع والقواعد النقية بلا إطار عمل
- `src/application` و`src/ports` و`src/adapters` — حالات الاستخدام وعقودها وتنفيذها
- `src/store` و`src/pwa` و`src/motion` و`src/i18n` و`src/styles` — الحالة والعمل دون اتصال والحركة والترجمة
- `scripts` — بوابات التحقق، و`public` — الأيقونات والخطوط المستضافة ذاتياً

## الحوكمة

تبقى هنا `docs/ARCHITECTURE.md` و`docs/GLOSSARY.md` فقط؛ سجلات المراحل والقرارات والمراجعات والأدلة في مساحة التدقيق خارج المستودع.
