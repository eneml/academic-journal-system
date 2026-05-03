// Placeholder until `pnpm --filter @ajs/api-client generate` produces
// real services from the Spring Boot OpenAPI document at /v3/api-docs.
// Once generated, re-export from "./generated" here.

export interface ApiClientConfig {
  /** Backend base URL, e.g. http://localhost:8080 */
  baseUrl: string;
  /** Optional bearer token resolver; called per request. */
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

/**
 * Minimal fetch helper; serves as a stand-in until the generated client lands.
 */
export async function apiFetch(
  cfg: ApiClientConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (cfg.getAccessToken) {
    const token = await cfg.getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${cfg.baseUrl}${path}`, { ...init, headers });
}
