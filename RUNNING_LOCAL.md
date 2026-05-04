# Running locally

The stack is three processes you start in three terminals.

## Pre-reqs (one time)

- **Java 25** at `~/Library/Java/JavaVirtualMachines/jdk-25.0.3+9` (or any 25 install — `JAVA_HOME=$(/usr/libexec/java_home -v 25)` resolves it).
- **Maven 3.9+**: `brew install maven`
- **pnpm 10+**: `brew install pnpm` (or `npm i -g pnpm@10`)
- **Docker Desktop** running (for the infra stack).

## 1. Infra (postgres + redis + minio + keycloak + mailpit)

```sh
cd /path/to/academic-journal-system

# .env is gitignored — copy and edit if needed
cp -n .env.example .env 2>/dev/null || true   # (.env.example doesn't exist yet — see real values below)

docker compose up -d
docker compose ps   # 5 services healthy
```

If `.env` is missing, the compose file requires:

```
DB_PASSWORD=rootroot
S3_SECRET_KEY=rootroot
KEYCLOAK_ADMIN_PASSWORD=rootroot
KC_USER_ADMIN_PASSWORD=rootroot
KC_USER_EDITOR_PASSWORD=rootroot
KC_USER_REVIEWER_PASSWORD=rootroot
KC_USER_AUTHOR_PASSWORD=rootroot
```

| service | port | UI / verification |
|---|---|---|
| postgres | 5432 | `docker exec aj-postgres psql -U journal -d academic_journal -c '\dt'` |
| redis | 6379 | `docker exec aj-redis redis-cli ping` |
| minio | 9001 | http://localhost:9001 — `minioadmin` / `rootroot` |
| keycloak | 8081 | http://localhost:8081 — `admin` / `rootroot` |
| mailpit | 8025 | http://localhost:8025 — outgoing email viewer |

> If postgres rejects the password (e.g. you changed `.env` after first init), `docker rm aj-postgres && docker volume rm academic-journal-system_postgres-data && docker compose up -d postgres`.

## 2. Backend (Spring Boot, port 8080)

In a new terminal — keep this open while using the app.

```sh
cd /path/to/academic-journal-system

DB_PASSWORD=rootroot \
S3_SECRET_KEY=rootroot \
KEYCLOAK_ADMIN_PASSWORD=rootroot \
KC_USER_ADMIN_PASSWORD=rootroot \
KC_USER_EDITOR_PASSWORD=rootroot \
KC_USER_REVIEWER_PASSWORD=rootroot \
KC_USER_AUTHOR_PASSWORD=rootroot \
JAVA_HOME=$(/usr/libexec/java_home -v 25) \
mvn spring-boot:run
```

Verify:
- http://localhost:8080/actuator/health → `"status":"UP"`
- http://localhost:8080/swagger-ui.html → all endpoints
- http://localhost:8080/v3/api-docs → OpenAPI JSON

## 3. Frontend (public site + editorial app)

In another new terminal:

```sh
cd /path/to/academic-journal-system/frontend

# one time: copy env files (gitignored)
cp apps/editorial/.env.example apps/editorial/.env.local
cp apps/public-site/.env.example apps/public-site/.env.local

pnpm install
pnpm dev   # runs both apps in parallel via turbo
```

Or run them separately:

```sh
pnpm --filter @ajs/public-site dev   # http://localhost:3000
pnpm --filter @ajs/editorial dev     # http://localhost:5173
```

| URL | what |
|---|---|
| http://localhost:3000 | public reading site (homepage, /issues, /announcements, /search, /sections/{code}, /articles/{slug}) |
| http://localhost:5173 | editorial app (sign in via Keycloak, then author/reviewer/editor/admin pages) |

## 4. Login

Realm `academic-journal` on Keycloak ships 4 pre-created users (passwords from `.env`, all `rootroot`):

| username | roles | what they can do |
|---|---|---|
| `admin` | ADMIN, EDITOR, AUTHOR | full administration |
| `editor` | EDITOR, AUTHOR | triage submissions, invite reviewers, take decisions, publish |
| `reviewer` | REVIEWER, AUTHOR | accept invitations, submit reviews |
| `author` | AUTHOR | start submissions, upload manuscripts, manage contributors |

Sign in flow: editorial app at `:5173` → "Sign in" → redirected to Keycloak at `:8081` → after login redirected back with a token.

## 5. Walking through the workflow end-to-end

The fastest demo, after everything is up:

1. **Sign in as `author`** at http://localhost:5173.
2. Sidebar → **New submission** → pick a section + locale → **Start**.
3. On the detail page: fill title + abstract + keywords → **Save metadata**.
4. **+ Add author** with your details, mark corresponding.
5. **Files** → pick stage `MANUSCRIPT` + a genre → upload a PDF.
6. **Submit to editors**.
7. Sign out, **sign in as `editor`** → sidebar → **Editorial queue** → click your submission.
8. Open **round 1** → **+ Invite reviewer** → pick `reviewer` from the list.
9. Sign out, **sign in as `reviewer`** → sidebar → **My review assignments** → open it → **Accept** → fill the form → **Submit review**.
10. Sign back in as `editor` → on the submission detail you'll see the review → **Record decision** `SEND_TO_PRODUCTION`.
11. **Publications** card → **Draft first version** → metadata editor → **+ Add galley** (set label to `PDF`, internal file id of the manuscript) → **Approve** → **Publish now**.
12. Visit http://localhost:3000 — your article is on the homepage and at `/articles/{slug}`.

## 6. Email verification

Notification emails go to **Mailpit** at http://localhost:8025 — they don't leave the machine.

## 7. Object storage verification

Uploaded files are stored in MinIO bucket `academic-journal` at http://localhost:9001 (login `minioadmin` / `rootroot`).

## 8. Tests

```sh
# Backend
mvn test

# Frontend (lint + type-check + build)
cd frontend && pnpm -r run lint && pnpm -r run type-check && pnpm build
```

## 9. Stop

```sh
# Ctrl+C in the backend + frontend terminals, then:
docker compose down            # keeps data volumes
# or
docker compose down -v         # wipes postgres + minio + keycloak realm imports
```
