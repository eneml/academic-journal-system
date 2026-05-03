# Academic Journal Frontend

Frontend monorepo for the Academic Journal management system.

## Structure

- `apps/public-site` — Next.js 15 public-facing site
- `apps/editorial` — Vite + React 19 editorial workbench (SPA)
- `packages/ui` — Shared design tokens and UI primitives
- `packages/api-client` — Generated OpenAPI client (target)
- `packages/auth` — OIDC client helper for Keycloak
- `packages/i18n` — Translation messages (en, ro)
- `packages/tsconfig` — Shared TypeScript presets
- `packages/eslint-config` — Shared ESLint config

## Prerequisites

- Node.js 20.18+
- pnpm 10+ (use `corepack enable && corepack prepare pnpm@latest --activate`)
- Backend running at `http://localhost:8080`
- Keycloak running at `http://localhost:8081` (realm `academic-journal`)

## Quickstart

```bash
pnpm install
cp apps/public-site/.env.example apps/public-site/.env.local
cp apps/editorial/.env.example apps/editorial/.env.local
pnpm dev
```

- public-site: http://localhost:3000
- editorial: http://localhost:5173
