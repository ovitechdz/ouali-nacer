# Arabic Font Verification — Inter + Cairo

**Question:** do the style-site fonts support Arabic, and is Cairo actually
rendering (not silently replaced by a system fallback)?

**Answer:** yes. Cairo is loaded with an explicit Arabic `unicode-range`, is the
computed font for `[lang="ar"]`, and produces different glyph metrics from every
system fallback. No complementary Arabic font is needed, so L-1's rejected
Amiri / IBM Plex Sans Arabic pairing is **not** replaced by a third family.

---

## 1. What is loaded

Google Fonts CSS (`google-fonts.css`, fetched 2026-11-05) requests:

```
family=Inter:wght@400;500;600;700;800
family=Cairo:wght@400;500;600;700;800
```

Cairo is split into three subsets per weight. The Arabic subset declares:

```
font-family: 'Cairo';
unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1,
  U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF,
  U+FE70-FE74, U+FE76-FEFC, …;
```

That range covers the Arabic block, Arabic Supplement, Arabic Extended-A/B,
Arabic Presentation Forms-A/B, and the Arabic mathematical alphabets — i.e. the
full repertoire this product needs (letters, diacritics, tatweel, ZWJ/ZWNJ,
Arabic-Indic digits if ever enabled).

In the running Arabic page, `document.fonts` reports Cairo 400/500/700 as
`loaded` (Arabic + Latin subsets), and the computed body font is:

```
Cairo, "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif
```

## 2. Proof that Cairo is actually used

Canvas width probe at 32 px. If Cairo were silently missing, its measurement
would equal one of the fallbacks.

| Family requested | `فريق العمل` | `وحدات المنصة والوضع الريفي` |
|---|---:|---:|
| **Cairo** | **313.6** | **804.6** |
| Segoe UI | 353.1 | 897.5 |
| Tahoma | 368.5 | 941.9 |
| Arial | 374.0 | 948.1 |
| sans-serif | 374.0 | 948.1 |
| serif | 372.9 | 911.8 |
| Inter (Latin-only) | 369.5 | 960.1 |

Cairo is 11–16 % narrower than every fallback on the same string. That gap
cannot be produced by a fallback font. `document.fonts.check('16px Cairo',
'فريق العمل')` returns `true` in the FR document (where Cairo is declared but
not applied), confirming the face is available to the document.

## 3. Visual confirmation

- `screenshots/style-ar-home-1440.png` — Arabic RTL home, Cairo rendering.
- `screenshots/style-ar-equipe-1440.png` — Arabic RTL team page.
- `team-page-source/equipe-ar.txt` — the Arabic DOM text.

The Arabic screenshots show Cairo's characteristic open counters, short
descenders and even stroke weight, distinct from Segoe UI's Arabic.

## 4. Consequences for the rebuild

1. **Font stack:** Inter (Latin) + Cairo (Arabic), self-hosted WOFF2. No Amiri,
   no IBM Plex Sans Arabic, no Fraunces, no Manrope.
2. **Arabic rules copied from the style site:**
   `font-family: var(--font-arabic); letter-spacing: 0; line-height: 1.7;`
   Headings keep 24 px / 700 with a 1.35 line-height.
3. **Weights to self-host:** 400 (body), 500 (buttons/labels), 600 (semibold),
   700 (headings); 800 only if a page uses it. Subsets: Arabic + Latin; drop the
   `latin-ext` and math subsets unless a string needs them.
4. **Licences:** Inter and Cairo are SIL Open Font License 1.1. Keep the OFL
   files next to the WOFF2 files.
5. **No Google Fonts at runtime.** The style site's `<link>` to
   `fonts.googleapis.com` is a recorded deviation (DEV-18/DEV-20); the rebuild
   commits the font files.
6. **Fallback order stays:** `"Cairo", "Noto Sans Arabic", "Segoe UI", Tahoma,
   sans-serif` so a missing download degrades to an Arabic-capable system face,
   never to boxes.
7. **Inter must never be the Arabic face.** Inter has no Arabic coverage; the
   `[lang="ar"]` rule must win over any global `font-sans`.

## 5. Open point for the user

Cairo is the style site's own Arabic face, so this is not a new proposal — it
is the style site's stack. The only decision left is whether to keep Cairo as
the single Arabic family for headings and body (recommended, matches the style
site) or to introduce a display Arabic face. The recommendation is **keep
Cairo**; introducing another family would break the “tokens from the style
site” rule.
