import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "oidc-client-ts";
import { getUserManager, loginWithPassword, signIn, signOut } from "./oidc";
import { getRolesFromUser, type RealmRole } from "./roles";

export interface AuthState {
  user: User | null;
  roles: RealmRole[];
  loading: boolean;
  error: string | null;
  /** Redirect-based OIDC sign-in (kept for SSO; primary path is loginWithPassword). */
  signIn: () => Promise<void>;
  /** Direct-Grant in-app sign-in driven by /login. */
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const manager = getUserManager();
    let cancelled = false;

    // Hydrate on mount: if we already have a stored user, surface it.
    // Callback routes drive their own hydration, so don't re-trigger here.
    async function hydrate(): Promise<void> {
      try {
        const existing = await manager.getUser();
        if (cancelled) return;
        setUser(existing && !existing.expired ? existing : null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();

    // Stay in sync with silent renew, sign-in, and sign-out events.
    const onLoaded = (u: User): void => {
      if (!cancelled) setUser(u);
    };
    const onUnloaded = (): void => {
      if (!cancelled) setUser(null);
    };
    const onExpired = (): void => {
      // Token expired without a successful silent renew; drop the user so
      // the shell falls back to the unauthenticated state.
      if (!cancelled) setUser(null);
    };
    const onSilentError = (err: Error): void => {
      console.warn("Silent token renew failed:", err.message);
    };

    manager.events.addUserLoaded(onLoaded);
    manager.events.addUserUnloaded(onUnloaded);
    manager.events.addAccessTokenExpired(onExpired);
    manager.events.addSilentRenewError(onSilentError);

    return () => {
      cancelled = true;
      manager.events.removeUserLoaded(onLoaded);
      manager.events.removeUserUnloaded(onUnloaded);
      manager.events.removeAccessTokenExpired(onExpired);
      manager.events.removeSilentRenewError(onSilentError);
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      roles: getRolesFromUser(user),
      loading,
      error,
      signIn,
      // Wraps loginWithPassword so the AuthContext picks up the new user
      // synchronously — `manager.events.load(...)` may race with React's
      // commit phase, so we also call setUser locally for an immediate
      // re-render.
      loginWithPassword: async (email: string, password: string) => {
        const u = await loginWithPassword(email, password);
        setUser(u);
        setError(null);
      },
      signOut,
    }),
    [user, loading, error],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
