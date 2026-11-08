# OVITECH team page — source archive

Read-only archival capture of the style-site team page. Nothing here is a
rebuild input that has been converted or normalised: it is the page as served.

## Capture record

| Field | Value |
|---|---|
| Source URL | `https://ovitech-mvp-4ip1.arcada.app/equipe` |
| Captured | 2026-11-07 |
| Tool | `playwright-cli` 0.1.23 (Chromium, installed Chrome) |
| Auth | public demo credentials entered once for the capture; not stored in this repo |
| Locales | `fr` (default, LTR) and `ar` (RTL) |
| Viewports | 1440 × 1000 desktop, 420 × 900 mobile, full-page screenshots |
| App CSS | `/assets/index-DGhN7NLy.css` |
| App JS (not archived) | `/assets/index-B3cTYnlJ.js` |

## Contents

```
screenshots/
  equipe-fr-1440.png   desktop, French, full page
  equipe-fr-420.png    mobile, French, full page
  equipe-ar-1440.png   desktop, Arabic/RTL chrome, full page
  equipe-ar-420.png    mobile, Arabic/RTL chrome, full page
html/
  equipe-fr.html       document.documentElement.outerHTML, French
  equipe-ar.html       document.documentElement.outerHTML, Arabic (lang=ar dir=rtl)
text/
  equipe-fr.txt        document.body.innerText, desktop
  equipe-fr-420.txt    document.body.innerText, mobile
  equipe-ar.txt        document.body.innerText, desktop
  equipe-ar-420.txt    document.body.innerText, mobile
css/
  index-DGhN7NLy.css   compiled app stylesheet as served
  google-fonts.css     Google Fonts CSS for Inter + Cairo as served
  computed-styles-fr.json  selected computed styles, French desktop
  computed-styles-ar.json  selected computed styles, Arabic desktop
  assets-manifest.json     linked stylesheets and images observed in the DOM
  assets-manifest-raw.json raw evaluate output (kept for provenance)
images/
  ovitech-logo.png     page logo (1024 × 1024)
  icon-192.png         favicon / PWA icon
fonts/
  *.woff2              Inter v20 and Cairo v31 subsets referenced by google-fonts.css
manifest.webmanifest   PWA manifest as served
```

## Notes

- The page does not use inline `<style>` blocks; the only application CSS is the
  linked `index-DGhN7NLy.css`.
- The app stylesheet contains no `url()` asset references.
- Arabic mode translates the navigation, banner, counters, filters and buttons,
  but the page heading and member roles/bios remain French. That mixed state is
  preserved as-is, not corrected.
- Member e-mail addresses and WhatsApp contact links are public page content and
  are reproduced verbatim for fidelity.
- The page loads Google Fonts at runtime (Inter + Cairo); the rebuild itself is
  self-hosted, so this archive records the reference behaviour only.
- JavaScript bundles, third-party analytics/rrweb scripts and service-worker
  internals are intentionally not archived; only the CSS/HTML/image/text
  surface is preserved.
