// @vitest-environment node
//
// Integration test against a real, disposable SQLite database (same
// rationale as mobile-api.test.ts): token hashing/expiry/single-use is
// exactly the kind of logic only meaningfully verified against a real
// Prisma client. DATABASE_URL is repointed before any app module is
// imported, so this never touches prisma/dev.db.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(process.cwd(), "prisma", "test-password-reset.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createPasswordResetToken: any, consumePasswordResetToken: any;

let userId: string;

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.rmSync(TEST_DB_PATH);
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  ({ db } = await import("@/lib/db"));
  ({ createPasswordResetToken, consumePasswordResetToken } = await import("./password-reset"));

  const user = await db.user.create({ data: { name: "Jordan", email: "jordan@example.com" } });
  userId = user.id;
}, 30_000);

afterAll(async () => {
  await db?.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
});

describe("password reset tokens", () => {
  it("resolves a freshly issued token to the user that requested it", async () => {
    const token = await createPasswordResetToken(userId);
    const resolved = await consumePasswordResetToken(token);
    expect(resolved).toBe(userId);
  });

  it("rejects an unknown token", async () => {
    expect(await consumePasswordResetToken("not-a-real-token")).toBeNull();
  });

  it("cannot be redeemed twice", async () => {
    const token = await createPasswordResetToken(userId);
    expect(await consumePasswordResetToken(token)).toBe(userId);
    expect(await consumePasswordResetToken(token)).toBeNull();
  });

  it("invalidates a previously issued, still-unused token when a new one is requested", async () => {
    const first = await createPasswordResetToken(userId);
    const second = await createPasswordResetToken(userId);

    expect(await consumePasswordResetToken(first)).toBeNull();
    expect(await consumePasswordResetToken(second)).toBe(userId);
  });

  it("rejects an expired token", async () => {
    const token = await createPasswordResetToken(userId);
    await db.passwordResetToken.updateMany({
      where: { userId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await consumePasswordResetToken(token)).toBeNull();
  });
});
