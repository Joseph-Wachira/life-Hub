import { request, setSessionExpiredHandler } from "./client";
import { tokenStorage } from "@/lib/storage/token-storage";

jest.mock("@/lib/storage/token-storage", () => ({
  tokenStorage: {
    getTokens: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, json: async () => body } as Response;
}

describe("apiClient request", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    globalThis.fetch = jest.fn();
    setSessionExpiredHandler(null);
  });

  it("attaches the bearer token and unwraps { data }", async () => {
    (tokenStorage.getTokens as jest.Mock).mockResolvedValue({ accessToken: "token-1", refreshToken: "refresh-1" });
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ data: { hello: "world" } }));

    const result = await request<{ hello: string }>("/ping");

    expect(result).toEqual({ hello: "world" });
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer token-1");
  });

  it("refreshes exactly once on a 401 and retries with the new access token", async () => {
    (tokenStorage.getTokens as jest.Mock).mockResolvedValue({ accessToken: "expired", refreshToken: "refresh-1" });
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "expired" } }, false, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { tokens: { accessToken: "new-token", refreshToken: "refresh-2" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { hello: "world" } }));

    const result = await request<{ hello: string }>("/tasks");

    expect(result).toEqual({ hello: "world" });
    expect(tokenStorage.setTokens).toHaveBeenCalledWith("new-token", "refresh-2");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    const retryCall = (globalThis.fetch as jest.Mock).mock.calls[2];
    expect(retryCall[1].headers.Authorization).toBe("Bearer new-token");
  });

  it("calls the session-expired handler and rejects when the refresh call itself fails", async () => {
    (tokenStorage.getTokens as jest.Mock).mockResolvedValue({ accessToken: "expired", refreshToken: "refresh-1" });
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ error: {} }, false, 401))
      .mockResolvedValueOnce(jsonResponse({ error: {} }, false, 401));

    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    await expect(request("/tasks")).rejects.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(tokenStorage.clearTokens).toHaveBeenCalled();
  });

  it("does not attach a bearer token or retry-on-401 when auth: false", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    await request("/auth/login", { method: "POST", body: { email: "a@b.com" }, auth: false });

    expect(tokenStorage.getTokens).not.toHaveBeenCalled();
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });
});
