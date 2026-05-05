# Academic Journal System

An open-source platform for running peer-reviewed scholarly journals end-to-end:
authors submit manuscripts, editors triage and assign reviewers, reviewers
return structured feedback, the editorial board takes decisions, and
publications are released to a public reading site with DOIs, citation
exports, and OAI-PMH / RSS / sitemap surfaces.

The codebase is a single Spring Boot 3 modular monolith on the back end and a
pnpm + turbo monorepo on the front end with two React apps — a public reading
site (Next.js) and an editorial workbench (Vite SPA).

---

## Highlights

- **Modular monolith.** Spring Modulith enforces module boundaries; cross-module
  calls go through `::api` packages only, no module reaches into another's
  internals. Boundaries are verified in CI on every push.
- **Production-shaped infra in dev.** PostgreSQL, Redis, MinIO (S3), Keycloak,
  and Mailpit run as Docker services so you exercise the same wire protocols
  you'd see in production.
- **Open-access by default.** Articles are released CC BY 4.0, indexed with
  Crossref DOIs, and exposed via RSS, sitemap.xml, OAI-PMH, and a JSON API.
- **OIDC end-to-end.** Authors / reviewers / editors / admins authenticate
  through Keycloak; the editorial app uses authorization-code-with-PKCE plus a
  custom Direct-Grant login for in-app sign-in.
- **Real workflow engine.** 12 editorial decisions wired to the submission
  state machine — review-round lifecycle, accept / decline / request revisions,
  send-to-production / back-from-production transitions, all audited.

---

## Tech Stack

### Back end

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Language         | Java 25                                             |
| Framework        | Spring Boot 3.5, Spring Modulith                    |
| Persistence      | PostgreSQL 17 + Flyway, Spring Data JPA / Hibernate |
| Cache            | Redis 7                                             |
| Object storage   | S3-compatible (MinIO in dev)                        |
| Auth             | Keycloak 26 (OIDC + admin REST API)                 |
| Mail             | Spring Mail + Thymeleaf, Mailpit in dev             |
| Observability    | Micrometer + OpenTelemetry, optional Prometheus     |
| Testing          | JUnit 5, Mockito, Testcontainers, Spring Boot Test  |
| API docs         | springdoc-openapi → Swagger UI                      |
| Build            | Maven 3.9                                           |

### Front end

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Language         | TypeScript 5 (strict)                               |
| Public site      | Next.js 15 App Router (RSC + revalidate)            |
| Editorial app    | Vite 6 + TanStack Router (file-based routing)       |
| UI               | React 19 + Tailwind v4 + Radix UI primitives        |
| State            | React Server Components / `useState` + URL state    |
| Auth client      | `oidc-client-ts` against Keycloak                   |
| Forms / actions  | Native `<form>` + server actions / fetch            |
| Lint / typecheck | ESLint flat config (typescript-eslint), tsc        |
| Build            | pnpm workspaces + Turborepo                         |

### Cross-cutting

- **Schema-first API.** Backend exposes OpenAPI; the frontend's
  `@ajs/api-client` package is generated from it so route handlers and
  client calls share types.
- **Modulith documentation.** A test run regenerates module diagrams under
  `target/spring-modulith-docs/` (PlantUML / C4) for architecture review.
- **Postgres FTS.** Full-text search runs as a Postgres index fed by
  publication events — no Elasticsearch dependency.

---

## Running locally

You'll need three terminals: infra (Docker), backend (Maven), frontend (pnpm).

### Prerequisites

- Java 25 (`JAVA_HOME=$(/usr/libexec/java_home -v 25)`)
- Maven 3.9+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker Desktop running

### 1. Infra

Copy the env template and start the stack:

```sh
cp .env.example .env  # edit only if you need different passwords
docker compose up -d
```

This brings up:

| Service   | Port | UI                                                                  |
| --------- | ---- | ------------------------------------------------------------------- |
| Postgres  | 5432 | `docker exec -it aj-postgres psql -U journal -d academic_journal`   |
| Redis     | 6379 | `docker exec aj-redis redis-cli ping`                               |
| MinIO     | 9001 | <http://localhost:9001> (`minioadmin` / your `S3_SECRET_KEY`)       |
| Keycloak  | 8081 | <http://localhost:8081> (`admin` / your `KEYCLOAK_ADMIN_PASSWORD`)  |
| Mailpit   | 8025 | <http://localhost:8025>                                             |

### 2. Backend

```sh
mvn spring-boot:run
```

Verify:

- `http://localhost:8080/actuator/health` → `"status":"UP"`
- `http://localhost:8080/swagger-ui.html` for the interactive API
- `http://localhost:8080/v3/api-docs` for the raw OpenAPI

### 3. Frontend

```sh
cd frontend
cp apps/public-site/.env.example apps/public-site/.env.local
cp apps/editorial/.env.example apps/editorial/.env.local
pnpm install
pnpm dev   # runs both apps in parallel
```

| URL                     | What                                       |
| ----------------------- | ------------------------------------------ |
| <http://localhost:3000> | Public reading site (Next.js)              |
| <http://localhost:5173> | Editorial workbench (Vite SPA)             |

### Pre-provisioned users

The Keycloak realm import ships with four users (passwords from `.env`):

| Email                      | Roles                    |
| -------------------------- | ------------------------ |
| `admin@journal.local`      | ADMIN, EDITOR, AUTHOR    |
| `editor@journal.local`     | EDITOR, AUTHOR           |
| `reviewer@journal.local`   | REVIEWER, AUTHOR         |
| `author@journal.local`     | AUTHOR                   |

---

## Architecture

### Modules

The backend is split into bounded contexts under `com.eneml.ajs.<module>`,
each with its own `package-info.java` declaring `@ApplicationModule` and the
modules it's allowed to depend on. Cross-module calls go through `::api`
named interfaces — domain entities, repositories, and services are
package-private under `internal.*`.

| Module          | Owns                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `journal`       | Journal config, sections, masthead, genres                                |
| `identity`      | Users, role assignments, Keycloak provisioning                            |
| `storage`       | S3-backed file store with sha256 dedup and presigned URLs                 |
| `submission`    | Submission lifecycle, contributors, file uploads                          |
| `review`        | Review rounds, reviewer invitations, accept/decline/submit                |
| `editorial`     | Editorial decision engine, 12 decision types, audit trail                 |
| `publication`   | Versioning, draft/publish/unpublish, galleys, DOIs                        |
| `issue`         | Volumes, numbers, table-of-contents publishing                            |
| `messaging`     | In-app notifications + email via Thymeleaf templates                      |
| `audit`         | Omnibus event log fed by domain events                                    |
| `search`        | Postgres FTS index updated on publication events                          |
| `metrics`       | Per-publication views / downloads / citations                             |
| `integration`   | JATS XML generator, Crossref deposit, ORCID push                          |
| `announcement`  | Calls for papers, news, special issues                                    |

Boundaries are verified in CI by `ModularityTests` (`mvn -Dtest=ModularityTests test`).

### Data flow

Authors push manuscripts through the editorial workflow as a state machine:

```
SUBMISSION → EXTERNAL_REVIEW → EDITING → PRODUCTION → PUBLISHED
```

Decisions emit domain events; downstream modules (messaging, audit, search,
metrics) listen and update their own projections. Nothing reaches across
module boundaries except through events or the explicit `::api` interfaces.

### Deployment surface

| Surface                          | Path                                  |
| -------------------------------- | ------------------------------------- |
| Public REST                      | `/api/v1/*` (anonymous reads)         |
| Authenticated REST               | `/api/v1/*` (Keycloak Bearer)         |
| OpenAPI spec                     | `/v3/api-docs`                        |
| Swagger UI                       | `/swagger-ui.html`                    |
| Health / metrics                 | `/actuator/{health,prometheus,info}`  |
| RSS feed                         | `/feed.xml` (public-site)             |
| Sitemap                          | `/sitemap.xml` (public-site)          |
| OAI-PMH endpoint                 | `/oai-pmh` (public-site)              |

---

## Testing

```sh
# Backend — Testcontainers spins up real Postgres per test class
mvn verify

# Modulith boundary check only
mvn -Dtest=ModularityTests test

# Frontend
cd frontend
pnpm -r run type-check
pnpm -r run lint
```

CI on push to `main` runs all of the above plus an editorial-app build.

---

## License

MIT — see [LICENSE](./LICENSE).
