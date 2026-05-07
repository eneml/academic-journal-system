# public-site

Next.js 15 reading site for The Academic Journal — landing, articles, archive, editorial board, policies.

## Shared chrome

Header chrome consumes the shared `@ajs/ui` package alongside the editorial app:

- `Button`, `Badge`, `Input`, `Card`, `Separator` — primitives unified across both apps; no per-app duplicates
- `LanguageSwitcher` — cookie-persisted (`NEXT_LOCALE`), changes propagate to the editorial app on next request
- `UserMenu` (chip variant) — single component, OIDC integration shim lives in `components/UserMenu.tsx`
- Sign-in CTA — ghost button matched to the editorial topbar

App-local tokens (`--footer-*`) live in `app/globals.css`. Cross-app semantic tokens (`--danger-*`, `--success-*`, focus ring) live in `@ajs/ui/tokens.css`.

## Run

```bash
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm type-check
```
