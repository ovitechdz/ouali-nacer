# Team Page — Source Archive (`/equipe`)

**Source:** `https://ovitech-mvp-4ip1.arcada.app/equipe`
**Captured:** 2026-11-05, authenticated with the public demo account printed on
the site's own `/login` page (credentials deliberately not reproduced).
**Decision:** D-0025 — the rebuild reproduces this page **as-is** instead of the
reference's `/team` page.

This directory is a read-only visual and structural archive. It is not
production code: it is a Tailwind/React snapshot whose classes are tied to the
style site's compiled CSS.

---

## 1. Files

| File | What it is |
|---|---|
| `equipe-1440.png` | full-page screenshot, French, 1440 × 1200 |
| `equipe-420.png` | full-page screenshot, French, 420 × 900 |
| `equipe-ar-1440.png` | full-page screenshot, Arabic RTL, 1440 |
| `equipe-ar-420.png` | full-page screenshot, Arabic RTL, 420 |
| `equipe.html` | rendered DOM, French (35,957 chars) |
| `equipe.txt` | rendered text, French |
| `equipe-ar.html` | rendered DOM, Arabic RTL |
| `equipe-ar.txt` | rendered text, Arabic RTL |
| `equipe-members.json` | structured member data (5 records) |
| `equipe-add-member-modal-1440.png` | "Ajouter un membre" modal, desktop |
| `equipe-add-member-modal-420.png` | same modal as a bottom sheet |
| `equipe-add-member-modal.html` | modal DOM |
| `equipe-member-detail-420.png` | member detail modal (opened by clicking a card) |
| `assets/style-site.css` | the app's compiled CSS (85,696 bytes) |
| `assets/ovitech-logo.png` | the only image used on the page (1024 × 1024) |

Text was recovered from a PowerShell pipe that had decoded UTF-8 as CP850;
`equipe*.html/txt` were re-encoded back to UTF-8 and verified: 0 U+FFFD, 457
Arabic characters in the Arabic DOM.

---

## 2. Page anatomy (French, desktop)

1. **Page header**
   - H1 `Équipe de travail` (24 px / 700 / white).
   - Subtitle `Experts Ovitech — Ferme ovine Sidi Bel Abbès` (gray-400).
   - Primary button `+ Ajouter un membre` on the inline-end side
     (`#10b981`, radius 12 px).
2. **Statistics strip** — 4 equal tiles, each with a coloured gradient wash and
   matching 1 px border:
   | Label | Value (demo) | Colour |
   |---|---:|---|
   | Membres | 5 | emerald |
   | Départements | 4 | blue |
   | Sur site | 4 | cyan |
   | Disponibles | 5 | purple |
3. **Department filter** — pill chips: `Tous` (active, emerald filled),
   `Direction`, `Santé`, `Technique`, `Production`. Filtering is client-side.
4. **Member grid** — 3 columns at 1440, 1 column at 420.
   Each card:
   - 56 px initials avatar, `rounded-2xl`, gradient + `shadow-lg`;
   - name (14 px bold), role (12 px, emerald-400), department badge
     (10 px, gray-400, 1 px border, pill);
   - bio, 2-line clamp (12 px, gray-400);
   - e-mail line with a mail icon (11 px, gray-500);
   - full-width WhatsApp button `Contacter sur WhatsApp`, `#25D366`,
     radius 12 px, white bold;
   - the whole card lifts its border to emerald on hover.
   - Clicking the card body opens the **member detail modal**.
5. **Add tile** — the last grid cell is a dashed card with `+` and
   `Ajouter un membre`, opening the same modal as the header button.
6. **Add-member modal**
   - overlay `bg-black/70` + `backdrop-blur-sm`;
   - panel `max-w-lg`, radius 16 px, `bg-surface-2`, 1 px border;
   - fields: `Nom complet *`, `Rôle *`, `Département` (select, default
     `Technique`), `Email`, `Téléphone` (`+213 ...`), `Bio` (textarea);
   - actions: `Annuler` (secondary) and `Enregistrer` (emerald);
   - on mobile the panel becomes a bottom sheet (`items-end sm:items-center`).
7. **Member detail modal** (captured for Ouali Nacer)
   - 96 px avatar, department badge, name, role, bio;
   - rounded rows for e-mail and phone;
   - actions: WhatsApp (green), Email, LinkedIn.
     The LinkedIn control is present visually; the archived record only proves
     the WhatsApp link, so Phase 3 must not invent a LinkedIn URL.

---

## 3. Member data (demo)

`equipe-members.json` is the authoritative extraction: initials, name, role,
department, bio, e-mail, WhatsApp deep link. Five people, four departments:

| Initials | Name | Role | Department |
|---|---|---|---|
| ON | Ouali Nacer | Fondateur | Direction |
| OC | Ouali Chawki | Fondateur associé | Direction |
| ZA | Dr Ziane Amine | Vétérinaire collaborateur | Santé |
| KE | Khaled Elias Elhennani | Ingénieur en développement informatique | Technique |
| SS | Sebaï Salah | Zootechnicien — Ingénieur en agronomie | Production |

The WhatsApp links embed a prefilled greeting
(`Bonjour <name>, je vous contacte via Ovitech MVP.`).

Contact details are personal data that the site already publishes. The rebuild
must keep them behind an explicit team page, must not ship them in analytics or
logs, and should let the owner edit or remove them.

---

## 4. Behaviour notes

- The page is **client-side only**; members live in the demo store
  (`localStorage` key `ovitech-mvp-storage` was present in the session).
- Statistics are derived: `Membres` = count, `Départements` = distinct
  departments, `Sur site` / `Disponibles` = per-member flags
  (`4/5` in the demo data).
- No member photos: initials avatars only. The only image is the logo in the
  header, and the logo is **not** adopted (user directive: keep the reference
  logo).
- Icons are inline Lucide SVGs (mail, phone, message-circle, linkedin, plus, x).
- Department colours are fixed per member, not per department: ON emerald,
  OC blue/indigo, ZA pink/rose, KE cyan, SS orange.

---

## 5. Localisation findings (important for the rebuild)

In Arabic RTL the page mirrors correctly (grid flows right-to-left, stats and
chips mirror, buttons swap sides), **but**:

- the H1 stays `Équipe de travail` and the subtitle stays French;
- member names, roles, departments and bios stay French;
- the WhatsApp button label is translated (`تواصل عبر واتساب`);
- the department badge text stays French (`Direction`, `Santé`, …);
- some classes are physical (`.text-left`) and must become logical
  (`text-start`) in the rebuild.

So this page is **not** a localisation model. The rebuild keeps the visual
layout as-is but routes every visible string through the i18n layer (AR first,
FR/EN derived), and keeps the member data user-editable.

---

## 6. Rebuild mapping (Phase 3)

| Style-site element | Rebuild target |
|---|---|
| `equipe` page shell | `src/routes/equipe.tsx` (route `/equipe`, alias `/team` if needed) |
| member cards | `src/features/team/MemberCard.tsx` |
| stats strip | `src/features/team/TeamStats.tsx` |
| filters | `src/features/team/DepartmentFilter.tsx` |
| add/edit modal | `src/features/team/MemberFormDialog.tsx` |
| member detail | `src/features/team/MemberDetailDialog.tsx` |
| seed records | `src/domain/team/seed.ts` (development only) |
| tokens | `src/styles/tokens.css` (see `../design-extract-style/EXTRACTION-REPORT.md`) |

Rules:

1. Keep the layout, spacing and colours exactly; replace physical utilities
   with logical ones (`ms/me`, `ps/pe`, `start/end`, `text-start`).
2. Keep initials avatars and per-member gradients; no invented photos.
3. Make contact fields optional in the data model; never require an e-mail or
   phone to render a card.
4. Replace the hard-coded demo members with editable records; seed only in
   development (D-0019).
5. Do not invent a LinkedIn URL; render the action only when a URL exists.
6. Translate every string (page title included) through the AR-first message
   catalogue.
