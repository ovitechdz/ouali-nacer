# designlang vs. project tokens — comparison

**Run:** `npx designlang https://ovitech-mvp-4ip1.arcada.app --out docs/rebuild/design-extract-style`
**Tool:** designlang 13.4.0 · 2026-11-07
**Compared against:** `src/styles/tokens.css` (D-0023)
**Status:** report only — no token, CSS or component was modified.

> The capture is the **unauthenticated `/login` page**. It samples the public
> entry surface, not the authenticated app or the team page. The authoritative
> extraction remains `docs/design/` and the approved D-0023 token layer.

## Fonts

| Item | Project (`tokens.css`) | designlang | Difference |
|---|---|---|---|
| Latin family | `Inter`, then system fallbacks | `Inter` (18 uses) | Match. |
| Arabic family | `Cairo`, then `Noto Sans Arabic` / `Segoe UI` / `Tahoma` | Not detected | Extraction gap: the login page had no Arabic text rendered. Not a conflict. |
| Mono | Explicit system mono stack | Not detected | Extraction gap; login page uses no mono text. |
| Body type | No size tokens; component/Tailwind defaults | 12 px / 16 px, weight 500 | The rebuild has no type-scale tokens. Difference in encoding, not a conflicting value. |
| Heading type | No size tokens | h1 24 px / 32 px, weight 400 | Same: not tokenised in the rebuild. |

**Verdict:** keep `Inter` + `Cairo`. Nothing in the extraction justifies changing
the font stack.

## Colours

| Role | Project | designlang | Difference |
|---|---|---|---|
| Page background | `#0b1220` | `#0b1220` | Exact match. |
| Raised surface | `#111827` (`surface-2`) | `#070d18` (`bg1`) and `#0f172a` (`bg4`) | Different values. The login page paints gradients/darker panels; the approved token layer uses `#111827` / `#1a2332`. |
| Primary accent | `#10b981` | `#00d492` (primary) | **Different.** The login CTA green is brighter/more saturated than the approved accent. |
| Secondary accent | `#059669` (`accent-strong`) | `#009966` (secondary) | Different value, close in intent. |
| Accent 3 | `#064e3b` (`accent-soft`) | `#00786f` (accent) | Different value; the login page uses a teal-leaning accent, the rebuild a deep emerald. |
| On-accent text | `#04120c` (`accent-contrast`) | `#000000` (`onPrimary` / `onSecondary`) | Near-black vs pure black. Minor. |
| Foreground | `#e5e7eb` | `#e5e7eb` | Exact match. |
| Strong foreground | `#ffffff` | `#ffffff` | Exact match. |
| Muted foreground | `#9ca3af` | `#99a1af` | Close but not equal (Tailwind v4 OKLCH conversion). |
| Subtle foreground | `#6b7280` | `#6a7282` | Close but not equal (Tailwind v4 OKLCH conversion). |
| Borders | `#243044` / `#334155` | Not detected | Extraction gap; the login card border was not tokenised. |
| Semantic colours | `success` / `warn` / `danger` / `info` / `team` in OKLCH | Not reported | Extraction gap; login page shows no semantic states. |

**Verdict:** do not change the token layer from this run. The only substantive
conflict is the **login-page CTA green (`#00d492`) versus the approved
`#10b981`**. Treat `#00d492` as a login-page variant unless the user wants the
rebuilt accent updated; that would be a new visual decision, not a token fix.
The muted/subtle drifts (1–3 per channel) are rendering/OKLCH-conversion noise.

## Radii

| Project | designlang | Difference |
|---|---|---|
| `lg` 8 px, `xl` 12 px, `2xl` 16 px, `3xl` 24 px | `lg` 12 px, `xl` 24 px (only two values) | designlang observed only 12 px and 24 px on the login page; 8 px and 16 px were absent. Naming also differs: designlang's `lg`/`xl` labels do not map to the project's `lg`/`xl`. |

**Verdict:** no change. The extraction is a subset, not a contradiction. Do not
copy designlang's `lg`/`xl` names into the project; they would remap 8 px and
16 px incorrectly.

## Spacing

| Project | designlang | Difference |
|---|---|---|
| `--spacing: 0.25rem` (4 px base, full Tailwind scale) | base 4 px; 4, 8, 12, 16, 20, 24, 28, 32, 40, 64 px | Same base and same early steps. designlang lists a subset and jumps 40 → 64. |
| Container 72 rem | Content column 420 px (login form) | Different concepts; login form width is not the app container. |

**Verdict:** no change. The 4 px base is confirmed. designlang's 64 px is the
same value as Tailwind `16` (4 rem), so the two scales agree where they overlap.

## Other observations

- designlang rated the login page 82/100 with one failing contrast pair and 0 %
  WCAG score. This is a property of the sampled login surface, not of the
  approved app tokens.
- designlang detected **0 breakpoints**, 9 flex containers and 0 grids because
  the login page is a single narrow form; it says nothing about the app shell.
- designlang's generated `font-sans` drops the Arabic fallback chain; using it
  would regress RTL. Keep `src/styles/tokens.css` as the source of truth.

## Conclusion

No token change is recommended from this run. The extraction confirms the 4 px
spacing base, Inter, `#0b1220`, `#e5e7eb` and `#ffffff`. The material differences
are (a) the login CTA green `#00d492` vs `#10b981`, and (b) incomplete coverage
of Arabic, borders, semantic colours, 8/16 px radii and the full spacing scale.
Any accent change is a product/visual decision for Phase 5, requiring explicit
approval.
