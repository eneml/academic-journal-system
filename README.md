# Academic Journal System
Open-source platform for running peer-reviewed journals end-to-end: submission, review, editorial decisions, production, and publication.

## Scope
- Author manuscript submission and tracking
- Reviewer assignment and review rounds
- Editorial decision workflow with audit trail
- Publication management (versions, galleys, DOI integration)
- Public discovery surfaces (RSS, sitemap, OAI-PMH)

## Architecture
- Backend: Spring Boot modular monolith (`com.eneml.ajs.<module>`) with Spring Modulith boundaries
- Frontend:
  - `frontend/apps/public-site` (Next.js 15)
  - `frontend/apps/editorial` (Vite + React 19)
- Local services: PostgreSQL, Redis, MinIO, Keycloak, Mailpit (Docker Compose)

Workflow state machine:

`SUBMISSION → EXTERNAL_REVIEW → EDITING → PRODUCTION → PUBLISHED`

## Tech Stack
- Backend: Java 25, Spring Boot 3.5, Spring Data JPA, Flyway, Redis, Keycloak
- Frontend: TypeScript 5, Next.js 15, React 19, Vite 6, Tailwind v4, pnpm + Turborepo
- Tooling: Maven, ESLint, TypeScript, Testcontainers

## Local Setup
### Requirements
- Java 25
- Maven 3.9+
- Node.js 20.18+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker Desktop

### 1) Start infrastructure
Create `.env` in the project root:

```sh
cat > .env <<'EOV'
DB_PASSWORD=rootroot
S3_SECRET_KEY=rootroot
KEYCLOAK_ADMIN_PASSWORD=rootroot
KC_USER_ADMIN_PASSWORD=rootroot
KC_USER_EDITOR_PASSWORD=rootroot
KC_USER_REVIEWER_PASSWORD=rootroot
KC_USER_AUTHOR_PASSWORD=rootroot
EOV
docker compose up -d
```

### 2) Start backend
```sh
mvn spring-boot:run
```

### 3) Start frontend
```sh
cd frontend
pnpm install
cp apps/public-site/.env.example apps/public-site/.env.local
cp apps/editorial/.env.example apps/editorial/.env.local
pnpm dev
```

## Local URLs
- Public site: <http://localhost:3000>
- Editorial app: <http://localhost:5173>
- API docs: <http://localhost:8080/swagger-ui.html>
- OpenAPI: <http://localhost:8080/v3/api-docs>
- Keycloak: <http://localhost:8081>
- Mailpit: <http://localhost:8025>

## Testing
```sh
# backend
mvn verify
mvn -Dtest=ModularityTests test

# frontend
cd frontend
pnpm -r run type-check
pnpm -r run lint
```

## License
MIT — see [LICENSE](./LICENSE).
