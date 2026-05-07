# SPEC — Frontend chrome harmonization & Editorial Board polish

> Status: **draft, awaiting user approval**. No code changes happen until this spec is signed off.

## 1. Objective
Make the **landing-site chrome** (`PublicHeader`, `PublicFooter`, `UserMenu`) and the **Editorial Board** page feel premium and visually consistent with the **editorial app shell** (`AppShell`, `PageHeader`). Same design language, same primitives, same behavior — just rendered in two different layout contexts (marketing vs. workbench).

Refinement only. No redesign, no new features, no token changes (we may *add* derived semantic tokens; we do not change the existing palette / type / radius scale).

## 2. Scope
**In**
- Cross-app chrome elements: language switcher, user menu / sign-in CTA, button, badge, input, dropdown menu, avatar, status chip, focus rings.
- `apps/public-site/components/PublicHeader.tsx`, `PublicFooter.tsx`, `UserMenu.tsx`.
- `apps/public-site/app/editorial/page.tsx` (Editorial Board).
- `apps/editorial/src/components/AppShell.tsx`, `PageHeader.tsx`, `StatusChip.tsx`.
- `packages/ui` — promote duplicated primitives to a single shared library.
- Tailwind config alignment between the two apps so shared classes resolve to the same tokens.

**Out**
- Backend, routing, data layer.
- Brand identity (palette, fonts, logo).
- New routes / new components beyond what's needed for unification.
- Dark mode (not in current tokens).

## 3. Divergence inventory (audit results)

Severity legend: **P0** = breaks "same look across apps" promise · **P1** = same intent, drifting implementations · **P2** = inconsistent micro-state.

| # | Divergence | public-site | editorial | Severity |
|---|---|---|---|---|
| D1 | **Language switcher** — same UX promise, two implementations | `PublicHeader.tsx:66–74` static button, no menu, no actual locale change | `AppShell.tsx:521–552` real `DropdownMenu`, EN/RO toggle but only local state | **P0** |
| D2 | **User menu** — drop-down auth widget | `UserMenu.tsx` hand-rolled with refs / click-outside / Escape handler | `AppShell.tsx` `UserBadge` uses `DropdownMenu` primitive | **P0** |
| D3 | **Sign-in CTA** — signed-out state | bare `<a>` `text-[11px]` link | `<Button>` (sometimes `size="sm"`, sometimes default) | **P0** |
| D4 | **`Button` primitive duplicated** | `apps/public-site/components/ui/button.tsx` *with* `invert` variant | `apps/editorial/src/components/ui/button.tsx` *without* `invert` | **P1** |
| D5 | **`Badge` primitive duplicated *and* visually different** | `rounded-md`, has `mono` variant | `rounded-full`, no `mono` | **P0** |
| D6 | **`Input` primitive duplicated** | identical byte-for-byte | identical byte-for-byte | **P1** (pure duplication tax) |
| D7 | **Avatar** | `components/Avatar.tsx` w/ hue-gradient mode (used on Editorial Board) | inline `<span>` initials in `AppShell` (cobalt-soft circle) | **P1** |
| D8 | **`packages/ui` is anemic** | exports only `Icon` + `StageStepper` — neither app's button/badge/input lives here | same | **P0** (root cause of D2–D7) |
| D9 | **Hard-coded hex outside tokens** | `#b91c1c`, `#fff5f5`, `#fca5a5` in button/badge/UserMenu | same hex values in editorial button/badge/AppShell | **P1** |
| D10 | **`PublicFooter` background** uses inline `style={{ background: "oklch(18% 0.018 270)" }}` and sibling oklch values not declared in `tokens.css` | yes | n/a (no footer) | **P1** |
| D11 | **`PageHeader.tsx`** uses inline `style={{ ... }}` instead of Tailwind classes — only file in either app that does this | n/a | yes | **P2** |
| D12 | **Editorial Board advisory list** uses inline `style={{ columnCount: 3, columnGap: 40, columnRule: "..." }}` instead of utilities | yes | n/a | **P2** |
| D13 | **Focus-visible** states | only `focus-visible:outline-none` on Button — no visible ring; Input only changes border on focus | identical issue | **P0** (WCAG 2.2 AA fail on 2.4.7 focus visible & 2.4.11 focus not obscured) |
| D14 | **Hover transitions** | Button: `transition-all duration-150` | Button: same | OK |
| D15 | **Active path styling** | nav: amber underline | sidebar: cobalt-soft pill — different mechanic but each fits its layout | OK (intentional) |
| D16 | **Locale persistence** — `LocaleSwitcher` only flips local React state; no cookie / context / i18n provider wiring | n/a (no switcher does anything) | n/a | **P1** (but pre-existing — confirm whether in scope) |

**Root cause for most P0s: D8.** `packages/ui` was set up as a shared library but never used for the heavy primitives. Both apps independently re-implemented `shadcn` ones. Every harmonization fix funnels through fixing this.

## 4. Prioritized work breakdown
One atomic commit per task. Each task runs `/plan` → `/build` → `/test` → `/review` → `/ship`. After each commit I pause and check in.

### Phase A — foundation (shared primitive layer)
- **A1.** Add semantic tokens to `tokens.css` for the values currently hard-coded as hex / inline oklch: `--danger`, `--danger-soft`, `--danger-border`, `--success-soft`, `--success-deep`, `--success-border`, `--footer-bg`, `--footer-fg`, `--footer-fg-2`, `--footer-border`. Wire them into Tailwind config of both apps.
- **A2.** Promote `Button`, `Badge`, `Input`, `DropdownMenu`, `Tooltip`, `Card`, `Separator` from `apps/*/components/ui/*` into `packages/ui/src/primitives/`. Pick the *superset* of variants (e.g. keep `invert`; pick one badge shape — proposal: `rounded-md` for both, see Q1). Re-export from `@journal/ui`.
- **A3.** Replace consumers in both apps with imports from `@journal/ui`. Delete the duplicated `apps/*/components/ui/*` files.

### Phase B — chrome unification
- **B1.** Extract `LanguageSwitcher` into `packages/ui` as a real working component backed by the existing `@journal/i18n` package (cookie-persisted via `apps/public-site/app/api/locale/route.ts`, which already exists, plus a matching helper for the editorial app). Replace both call sites.
- **B2.** Extract `UserMenu` into `packages/ui` using the shared `DropdownMenu` primitive. One implementation, two adapters: a "public" adapter (signed-in CTA: open editorial workbench) and an "editorial" adapter (signed-in CTA: profile / sign out). Same visual.
- **B3.** Unify the signed-out **Sign-in** CTA — both use `<Button size="sm" variant="ghost">` with the same label.
- **B4.** Unify focus rings via a single Tailwind plugin / global class — every interactive primitive gets a 2px cobalt ring on `:focus-visible`. Fixes D13 (WCAG).

### Phase C — page polish
- **C1.** Editorial Board: replace inline `style` for the 3-column advisory list with Tailwind `columns-3` utility + `divide-x` rule. Consolidate spacing onto the same scale used elsewhere (`pt-10`, `pt-11` → tokenized stops).
- **C2.** `PageHeader`: convert inline styles to Tailwind classes. No visual change.
- **C3.** `PublicFooter`: replace inline `style` with the new `--footer-*` tokens from A1.

### Phase D — verification
- **D-verify-1.** Run dev servers for both apps, capture before/after screenshots of: top utility row, masthead + nav, footer, editorial app topbar, sidebar header. Diff side-by-side.
- **D-verify-2.** Axe-core / Lighthouse pass on `/`, `/editorial`, editorial `/`. Required: WCAG 2.2 AA, focus-visible on every interactive element.
- **D-verify-3.** Add a one-paragraph note to each app's `README.md` listing the shared primitives now consumed from `@journal/ui`.

## 5. Success criteria (testable)
1. **Zero duplicated primitives.** `apps/public-site/components/ui/` and `apps/editorial/src/components/ui/` are empty (or removed). Both apps import from `@journal/ui`.
2. **Same component, same render.** Side-by-side screenshots of `<Button>`, `<Badge>`, `<Input>`, `<UserMenu>`, `<LanguageSwitcher>` in both apps are visually identical (no pixel diff in the chrome-only crops).
3. **Language switcher works** in both apps and persists across reload (cookie). Switching in public-site reflects in editorial and vice versa on next load.
4. **No raw hex / inline oklch in component files.** `grep -rE '#[0-9a-fA-F]{6}|oklch\(' apps/ packages/ui/src/primitives/` returns only `tokens.css`.
5. **Every interactive element has visible focus.** Manual keyboard tab pass through public-site `/editorial` and editorial `/` shows a cobalt ring on every reachable control.
6. **No inline `style={{...}}` in changed files** (except for dynamic values like `Avatar` size).
7. **Both apps build green.** `pnpm -r build`, `pnpm -r typecheck`, `pnpm -r lint`.
8. **Atomic git history.** Each of the ~10 phase items is one commit, short imperative subject.

## 6. Decisions (resolved with the user)
1. **Q1 — Badge shape → `rounded-md` (6px / `--r-2`).** Same radius family as Button and `.chip`. Press/editorial feel. Editorial's `Badge` re-shapes from `rounded-full` to `rounded-md`.
2. **Q2 — Locale persistence → wire both apps.** Cookie-based via the existing `apps/public-site/app/api/locale/route.ts`. `@journal/i18n` gets a tiny `setLocaleCookie`/`readLocaleCookie` helper that runs in both Next (RSC + client) and Vite. Switching in one app reflects in the other on next request.
3. **Q3 — Shared package consumption → source-only TS.** `@journal/ui` ships TS source, no compile step. Both apps' `tailwind.config.*` add `packages/ui/src/**/*.{ts,tsx}` to their `content` glob. Standard pnpm + turbo pattern.
4. **Q4 — "Same look" scope → primitives unify, layouts stay context-aware.** 3-row masthead (public) and 56px topbar + sidebar (editorial) are intentionally different (marketing identity vs. workbench density). Every *primitive* placed inside those layouts becomes the same component, same render, same focus ring.
5. **Q5 — Sibling files → deferred.** Stay on the chrome + Editorial Board scope. Anything serious noticed in passing gets flagged as a separate task, not bundled.

## 7. Boundaries (per CLAUDE & memory)
- **Always:** keep tokens / type / radius identity intact; one atomic commit per task; short imperative commit messages; preserve `tnum`, `chip`, `stage-stepper` and other token-class names that are referenced from app code.
- **Ask first:** any new token name (Q1–Q5 above), any change to public visible copy (e.g. CTA labels), any new dependency added to `package.json`.
- **Never:** add OJS/PKP attribution comments; downgrade tool versions to match local; introduce new colors outside the cobalt+amber+warm-white palette; add brand-new icons or fonts; touch `routing` / `data layer` / `backend`.

---

**Next step:** start **Phase A1** — add semantic tokens and wire them into both Tailwind configs. One commit. Pause and check in before A2.
