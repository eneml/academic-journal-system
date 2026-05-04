/**
 * Placeholder schema. Run `pnpm --filter @ajs/api-client generate` with
 * the backend live (default URL `http://localhost:8080/v3/api-docs`) to
 * replace this file with the actual generated types from the running
 * Spring Boot OpenAPI document.
 *
 * Until then, the editorial app's `lib/api.ts` declares its own ad-hoc
 * shapes. Once the schema lands, prefer importing from
 * `@ajs/api-client/schema` for end-to-end type safety:
 *
 *     import type { components, paths } from "@ajs/api-client/schema";
 *     type PublicationResponse = components["schemas"]["PublicationResponse"];
 */
export type paths = Record<string, never>;
export type components = { schemas: Record<string, never> };
export type operations = Record<string, never>;
