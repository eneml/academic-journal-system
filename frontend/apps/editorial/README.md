# editorial

Vite + React 19 SPA for the editorial workbench — submissions, reviews, issue assembly, admin.

## Shared chrome

The app shell consumes the shared `@ajs/ui` package alongside the public site:

- `Button`, `Badge`, `Input`, `Card`, `Separator`, `DropdownMenu`, `Tooltip` — primitives unified across both apps; no per-app duplicates
- `LanguageSwitcher` — cookie-persisted (`NEXT_LOCALE`), changes propagate to the public site on next request
- `UserMenu` (badge variant) — sidebar bottom widget driven by `AuthContext`
- Sign-in CTA — ghost button matched to the public-site chip

Editorial-only primitives (`tabs`, `sheet`, `sonner`, `scroll-area`, `textarea`) still live in `src/components/ui/` until they are needed by the public site.

## Run

```bash
pnpm dev          # http://localhost:5173
pnpm build        # production build (tsr generate + tsc + vite)
pnpm type-check
```
