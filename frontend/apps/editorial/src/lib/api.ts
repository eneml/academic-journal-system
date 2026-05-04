import { getUserManager } from "../auth/oidc";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  // Fail loud at module load if the API base URL isn't configured. The shell
  // can still render — fetches will surface the misconfig with a clear error.
   
  console.error("VITE_API_BASE_URL is not set; API calls will fail.");
}

/** A Spring Data Page<T> envelope. */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Resolve the current bearer token, attempting a silent renew if the cached
 * one is expired. Returns null if no user / can't refresh.
 */
async function getAccessToken(): Promise<string | null> {
  const manager = getUserManager();
  let user = await manager.getUser();
  if (!user) return null;

  if (user.expired) {
    try {
      const renewed = await manager.signinSilent();
      if (renewed) user = renewed;
    } catch (err) {
       
      console.warn("Silent renew failed:", err);
      return null;
    }
  }

  return user?.access_token ?? null;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Fetch a JSON resource from the backend with the current bearer token attached.
 *
 * On any of:
 *   - missing/expired token that can't be silently renewed
 *   - network failure
 *   - non-OK response
 *
 * returns null and logs to console. This keeps page renders resilient — call
 * sites can show their own empty / placeholder state when null comes back.
 */
export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T | null> {
  if (!BASE_URL) return null;

  const token = await getAccessToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (opts.body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
     
    console.warn(`API ${opts.method ?? "GET"} ${path} failed (network):`, err);
    return null;
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
     
    console.warn(`API ${opts.method ?? "GET"} ${path} -> ${response.status}`);
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
     
    console.warn(`API ${path} returned non-JSON body:`, err);
    return null;
  }
}
