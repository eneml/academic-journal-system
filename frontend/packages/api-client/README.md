# @ajs/api-client

Typed contracts for the Spring Boot backend. Two layers:

1. **`./src/index.ts`** — a tiny runtime fetch helper used by the
   editorial app. Adds a bearer token if you give it a resolver.
2. **`./src/schema.d.ts`** — pure TypeScript types generated from the
   backend's OpenAPI document at `/v3/api-docs`.

## Generating the schema

The backend must be running. Default endpoint is
`http://localhost:8080/v3/api-docs`; override with `OPENAPI_URL` if you
point at a hosted environment.

```sh
# from anywhere in the workspace
pnpm --filter @ajs/api-client generate

# or against a hosted environment
OPENAPI_URL=https://api.example.org/v3/api-docs pnpm --filter @ajs/api-client generate
```

The script writes `src/schema.d.ts`. **Commit it** so consumers get the
types without re-running the generator.

The generator (`openapi-typescript`) is types-only — no runtime, no
classes, no decorators. The output is a single `.d.ts` exporting three
top-level shapes:

| Export       | What it gives you                                                |
|--------------|------------------------------------------------------------------|
| `paths`      | A map keyed by URL template, each value carries operation specs. |
| `components` | DTO schemas — `components["schemas"]["PublicationResponse"]`.    |
| `operations` | Operation-level types when `operationId` is set.                 |

## Using the schema

In the editorial app:

```ts
import type { components } from "@ajs/api-client/schema";

type PublicationResponse = components["schemas"]["PublicationResponse"];
type Article = components["schemas"]["PublicArticleResponse"];
```

Combine with the runtime helper:

```ts
import { apiFetch } from "@ajs/api-client";
import type { components } from "@ajs/api-client/schema";

const cfg = { baseUrl: "http://localhost:8080" };
const res = await apiFetch(cfg, "/api/v1/articles/some-slug");
const article = (await res.json()) as components["schemas"]["PublicArticleResponse"];
```

## When to regenerate

After any backend change that affects:
- A `@RestController` endpoint (path, method, params, body, response).
- A DTO record / class shape.
- A bean validation annotation that changes the OpenAPI required-fields set.

Don't regenerate from a stale dev DB — make sure migrations have run
and the backend is fully up.
