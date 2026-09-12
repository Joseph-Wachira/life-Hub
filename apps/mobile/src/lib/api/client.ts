import { mobileApiPaths, type ApiErrorPayload } from "@lifehub/shared";
import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/storage/token-storage";
import { getDeviceName } from "@/lib/api/device";

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
  }
}

/** Thrown when `fetch` itself fails (no connectivity, DNS, etc.) — distinct from a server-returned error response. */
export class NetworkError extends Error {}

let onSessionExpired: (() => void) | null = null;
/** Registered once by AuthProvider so the client can force a sign-out when refresh fails, without importing auth state here. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const { refreshToken } = await tokenStorage.getTokens();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${env.apiUrl}${mobileApiPaths.refresh()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Name": getDeviceName() },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      await tokenStorage.clearTokens();
      return null;
    }
    const json = await response.json();
    const { accessToken, refreshToken: nextRefreshToken } = json.data.tokens;
    await tokenStorage.setTokens(accessToken, nextRefreshToken);
    return accessToken as string;
  } catch {
    // A network error during refresh isn't a "session expired" — leave the
    // stored (stale) tokens alone so the next request can try again once
    // connectivity returns, instead of forcing a sign-out while offline.
    return null;
  }
}

/** De-dupes concurrent 401s into a single in-flight refresh call. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the bearer token and retry-on-401. Default true; login/refresh themselves pass false. */
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const { accessToken } = await tokenStorage.getTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const doFetch = (extraHeaders?: Record<string, string>) =>
    fetch(`${env.apiUrl}${path}`, {
      method,
      headers: extraHeaders ? { ...headers, ...extraHeaders } : headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch (error) {
    throw new NetworkError(error instanceof Error ? error.message : "Network request failed.");
  }

  if (response.status === 401 && auth) {
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      onSessionExpired?.();
      throw new ApiError(401, { code: "SESSION_EXPIRED", message: "Your session expired. Please sign in again." });
    }
    try {
      response = await doFetch({ Authorization: `Bearer ${newAccessToken}` });
    } catch (error) {
      throw new NetworkError(error instanceof Error ? error.message : "Network request failed.");
    }
  }

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const payload: ApiErrorPayload = json?.error ?? {
      code: "UNKNOWN_ERROR",
      message: `Request failed with status ${response.status}.`,
    };
    if (response.status === 401) onSessionExpired?.();
    throw new ApiError(response.status, payload);
  }

  const json = await response.json();
  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
