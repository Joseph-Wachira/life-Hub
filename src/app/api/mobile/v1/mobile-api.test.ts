// @vitest-environment node
//
// Route handlers here sign JWTs via jose, whose key-type check does a
// realm-sensitive `instanceof Uint8Array` — under the project-wide jsdom
// environment that fails against a jsdom-realm Uint8Array even when it's a
// genuine one. This suite is pure server-side/API and has no DOM
// dependency, so it runs under plain Node instead.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

/**
 * Integration tests against a real, disposable SQLite database — unlike the
 * rest of this repo's (deliberately DB-free) unit tests, auth/authorization
 * is exactly the kind of logic that's only meaningfully tested against a
 * real Prisma client: the thing being verified IS the query filter.
 *
 * DATABASE_URL is repointed to a scratch file before any app module is
 * imported (imports below are all dynamic, inside beforeAll, for that
 * reason), so this never touches prisma/dev.db.
 */

const TEST_DB_PATH = path.resolve(process.cwd(), "prisma", "test-mobile-authz.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;
const PASSWORD = "Demo12345";
const BASE_URL = "http://test.local/api/mobile/v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loginRoute: any, refreshRoute: any, logoutRoute: any, meRoute: any, tasksRoute: any, taskByIdRoute: any;

let userA: { id: string; workspaceId: string; taskId: string };
let userB: { id: string; workspaceId: string };

function jsonRequest(url: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  return new NextRequest(url, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

async function loginAs(email: string) {
  const res = await loginRoute.POST(jsonRequest(`${BASE_URL}/auth/login`, { method: "POST", body: { email, password: PASSWORD } }));
  expect(res.status).toBe(200);
  return (await res.json()).data as {
    tokens: { accessToken: string; refreshToken: string };
    user: { id: string; email: string };
  };
}

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.rmSync(TEST_DB_PATH);
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  ({ db } = await import("@/lib/db"));
  loginRoute = await import("@/app/api/mobile/v1/auth/login/route");
  refreshRoute = await import("@/app/api/mobile/v1/auth/refresh/route");
  logoutRoute = await import("@/app/api/mobile/v1/auth/logout/route");
  meRoute = await import("@/app/api/mobile/v1/auth/me/route");
  tasksRoute = await import("@/app/api/mobile/v1/tasks/route");
  taskByIdRoute = await import("@/app/api/mobile/v1/tasks/[id]/route");

  const passwordHash = await bcrypt.hash(PASSWORD, 4); // low cost factor: this only needs to be correct, not slow

  const a = await db.user.create({ data: { name: "User A", email: "a@example.com", passwordHash } });
  const workspaceA = await db.workspace.create({ data: { userId: a.id, name: "A's Workspace", type: "PERSONAL", isDefault: true } });
  const taskA = await db.task.create({ data: { workspaceId: workspaceA.id, title: "A's private task" } });

  const b = await db.user.create({ data: { name: "User B", email: "b@example.com", passwordHash } });
  const workspaceB = await db.workspace.create({ data: { userId: b.id, name: "B's Workspace", type: "PERSONAL", isDefault: true } });

  userA = { id: a.id, workspaceId: workspaceA.id, taskId: taskA.id };
  userB = { id: b.id, workspaceId: workspaceB.id };
}, 30_000); // shells out to `prisma db push` — slower than Vitest's 10s default hook timeout on a cold run

afterAll(async () => {
  await db?.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
});

describe("mobile API — authentication", () => {
  it("rejects login with a wrong password", async () => {
    const res = await loginRoute.POST(
      jsonRequest(`${BASE_URL}/auth/login`, { method: "POST", body: { email: "a@example.com", password: "wrong-password" } })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("rejects login for an email that doesn't exist", async () => {
    const res = await loginRoute.POST(
      jsonRequest(`${BASE_URL}/auth/login`, { method: "POST", body: { email: "nobody@example.com", password: PASSWORD } })
    );
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials and returns tokens + workspaces", async () => {
    const { tokens, user } = await loginAs("a@example.com");
    expect(user.email).toBe("a@example.com");
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
  });

  it("rejects /auth/me with no bearer token", async () => {
    const res = await meRoute.GET(jsonRequest(`${BASE_URL}/auth/me`));
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me with a malformed bearer token", async () => {
    const res = await meRoute.GET(jsonRequest(`${BASE_URL}/auth/me`, { headers: { Authorization: "Bearer not-a-real-token" } }));
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user on /auth/me with a valid token", async () => {
    const { tokens } = await loginAs("a@example.com");
    const res = await meRoute.GET(jsonRequest(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.user.email).toBe("a@example.com");
  });
});

describe("mobile API — cross-user authorization", () => {
  it("returns 403 when reading tasks for a workspace that belongs to a different user", async () => {
    const { tokens } = await loginAs("b@example.com");
    const res = await tasksRoute.GET(
      jsonRequest(`${BASE_URL}/tasks?workspaceId=${userA.workspaceId}`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });

  it("returns 404 (not another user's task) when the task id belongs to a different workspace", async () => {
    const { tokens } = await loginAs("b@example.com");
    const res = await taskByIdRoute.GET(
      jsonRequest(`${BASE_URL}/tasks/${userA.taskId}?workspaceId=${userB.workspaceId}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }),
      { params: Promise.resolve({ id: userA.taskId }) }
    );
    expect(res.status).toBe(404);
  });

  it("lets a user read their own task in their own workspace", async () => {
    const { tokens } = await loginAs("a@example.com");
    const res = await taskByIdRoute.GET(
      jsonRequest(`${BASE_URL}/tasks/${userA.taskId}?workspaceId=${userA.workspaceId}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }),
      { params: Promise.resolve({ id: userA.taskId }) }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(userA.taskId);
  });

  it("refuses to delete another user's task even with a valid token and their own real workspaceId elsewhere", async () => {
    const { tokens } = await loginAs("b@example.com");
    const res = await taskByIdRoute.DELETE(
      jsonRequest(`${BASE_URL}/tasks/${userA.taskId}?workspaceId=${userB.workspaceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }),
      { params: Promise.resolve({ id: userA.taskId }) }
    );
    expect(res.status).toBe(404);

    const stillThere = await db.task.findUnique({ where: { id: userA.taskId } });
    expect(stillThere).not.toBeNull();
  });
});

describe("mobile API — refresh token rotation & revocation", () => {
  it("rotates the refresh token, and rejects + revokes everything on reuse of the old one", async () => {
    const { tokens } = await loginAs("a@example.com");

    const refreshRes = await refreshRoute.POST(
      jsonRequest(`${BASE_URL}/auth/refresh`, { method: "POST", body: { refreshToken: tokens.refreshToken } })
    );
    expect(refreshRes.status).toBe(200);
    const refreshed = (await refreshRes.json()).data;
    // Only the refresh token is required to rotate. The access token is a
    // deterministic HS256 signature over {sub, email, iat, exp} — signing
    // the same claims again inside the same clock second legitimately
    // produces byte-identical output, which is fine since it isn't the
    // thing being used to prove one-time use.
    expect(refreshed.tokens.refreshToken).not.toBe(tokens.refreshToken);

    const meWithNewToken = await meRoute.GET(
      jsonRequest(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${refreshed.tokens.accessToken}` } })
    );
    expect(meWithNewToken.status).toBe(200);

    // Reusing the already-rotated (old) refresh token must fail...
    const reuseRes = await refreshRoute.POST(
      jsonRequest(`${BASE_URL}/auth/refresh`, { method: "POST", body: { refreshToken: tokens.refreshToken } })
    );
    expect(reuseRes.status).toBe(401);

    // ...and must revoke the legitimately-issued replacement too, as a
    // precaution against the old token having been copied by an attacker.
    const legitimateTokenAfterReuse = await refreshRoute.POST(
      jsonRequest(`${BASE_URL}/auth/refresh`, { method: "POST", body: { refreshToken: refreshed.tokens.refreshToken } })
    );
    expect(legitimateTokenAfterReuse.status).toBe(401);
  });

  it("revokes the refresh token on logout", async () => {
    const { tokens } = await loginAs("a@example.com");

    const logoutRes = await logoutRoute.POST(
      jsonRequest(`${BASE_URL}/auth/logout`, { method: "POST", body: { refreshToken: tokens.refreshToken } })
    );
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await refreshRoute.POST(
      jsonRequest(`${BASE_URL}/auth/refresh`, { method: "POST", body: { refreshToken: tokens.refreshToken } })
    );
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("logout is lenient about an already-invalid token (never errors)", async () => {
    const res = await logoutRoute.POST(
      jsonRequest(`${BASE_URL}/auth/logout`, { method: "POST", body: { refreshToken: "not-a-real-refresh-token" } })
    );
    expect(res.status).toBe(200);
  });
});
