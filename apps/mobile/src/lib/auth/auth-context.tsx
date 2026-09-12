import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mobileApiPaths, type LoginResponse, type MeResponse, type MobileUser, type MobileWorkspace } from "@lifehub/shared";
import { request, setSessionExpiredHandler } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/token-storage";
import { queryClient } from "@/lib/api/query-client";

type SessionStatus = "loading" | "signedIn" | "signedOut";

interface AuthState {
  status: SessionStatus;
  user: MobileUser | null;
  workspaces: MobileWorkspace[];
  activeWorkspaceId: string | null;
}

interface AuthContextValue extends AuthState {
  activeWorkspace: MobileWorkspace | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setActiveWorkspaceId: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = { status: "loading", user: null, workspaces: [], activeWorkspaceId: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  const signOut = useCallback(async () => {
    const { refreshToken } = await tokenStorage.getTokens();
    await tokenStorage.clearTokens();
    queryClient.clear();
    setState({ status: "signedOut", user: null, workspaces: [], activeWorkspaceId: null });
    if (refreshToken) {
      // Best-effort: the device is signed out locally regardless of whether
      // this network call succeeds.
      request(mobileApiPaths.logout(), { method: "POST", body: { refreshToken }, auth: false }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void signOut();
    });
    return () => setSessionExpiredHandler(null);
  }, [signOut]);

  const applySession = useCallback(async (user: MobileUser, workspaces: MobileWorkspace[]) => {
    let activeWorkspaceId = await tokenStorage.getActiveWorkspaceId();
    if (!activeWorkspaceId || !workspaces.some((w) => w.id === activeWorkspaceId)) {
      activeWorkspaceId = workspaces.find((w) => w.isDefault)?.id ?? workspaces[0]?.id ?? null;
      if (activeWorkspaceId) await tokenStorage.setActiveWorkspaceId(activeWorkspaceId);
    }
    setState({ status: "signedIn", user, workspaces, activeWorkspaceId });
  }, []);

  // Restore session on cold start: a stored access token (even an expired
  // one — the client's 401 handler transparently refreshes it) means we can
  // skip the sign-in screen.
  useEffect(() => {
    (async () => {
      const { accessToken, refreshToken } = await tokenStorage.getTokens();
      if (!accessToken && !refreshToken) {
        setState((s) => ({ ...s, status: "signedOut" }));
        return;
      }
      try {
        const me = await request<MeResponse>(mobileApiPaths.me());
        await applySession(me.user, me.workspaces);
      } catch {
        await tokenStorage.clearTokens();
        setState((s) => ({ ...s, status: "signedOut" }));
      }
    })();
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await request<LoginResponse>(mobileApiPaths.login(), {
          method: "POST",
          body: { email, password },
          auth: false,
        });
        await tokenStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        await applySession(result.user, result.workspaces);
        return {};
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Something went wrong. Please try again." };
      }
    },
    [applySession]
  );

  const setActiveWorkspaceId = useCallback(async (id: string) => {
    await tokenStorage.setActiveWorkspaceId(id);
    setState((s) => ({ ...s, activeWorkspaceId: id }));
    // Every screen's queries are keyed by workspaceId, so switching
    // workspaces just needs a blanket invalidate — each query naturally
    // refetches under its own (different) key.
    await queryClient.invalidateQueries();
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const workspaces = await request<MobileWorkspace[]>(mobileApiPaths.workspaces());
    setState((s) => ({ ...s, workspaces }));
  }, []);

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, activeWorkspace, signIn, signOut, setActiveWorkspaceId, refreshWorkspaces }),
    [state, activeWorkspace, signIn, signOut, setActiveWorkspaceId, refreshWorkspaces]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
