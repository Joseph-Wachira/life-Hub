// @vitest-environment node
//
// Integration test against a real, disposable SQLite database (same
// rationale as password-reset.test.ts): the counter's correctness IS the
// database read-modify-write, so it's only meaningfully tested against a
// real Prisma client. DATABASE_URL is repointed before any app module is
// imported, so this never touches prisma/dev.db.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(process.cwd(), "prisma", "test-rate-limit.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let assertWithinRateLimit: any, RateLimitError: any, formatRetryAfter: any;

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.rmSync(TEST_DB_PATH);
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  ({ db } = await import("@/lib/db"));
  ({ assertWithinRateLimit, RateLimitError, formatRetryAfter } = await import("./rate-limit"));
}, 30_000);

afterAll(async () => {
  await db?.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
});

describe("assertWithinRateLimit", () => {
  it("allows calls up to the limit, then throws", async () => {
    const key = "test:allows-then-blocks";
    for (let i = 0; i < 3; i++) {
      await expect(assertWithinRateLimit(key, { limit: 3, windowMs: 60_000 })).resolves.toBeUndefined();
    }
    await expect(assertWithinRateLimit(key, { limit: 3, windowMs: 60_000 })).rejects.toBeInstanceOf(RateLimitError);
  });

  it("keeps separate counters per key", async () => {
    await assertWithinRateLimit("test:key-a", { limit: 1, windowMs: 60_000 });
    // A different key isn't affected by key-a already being at its limit.
    await expect(assertWithinRateLimit("test:key-b", { limit: 1, windowMs: 60_000 })).resolves.toBeUndefined();
  });

  it("resets the count once the window has elapsed", async () => {
    const key = "test:window-reset";
    await assertWithinRateLimit(key, { limit: 1, windowMs: 60_000 });
    await expect(assertWithinRateLimit(key, { limit: 1, windowMs: 60_000 })).rejects.toBeInstanceOf(RateLimitError);

    // Simulate the window having already elapsed.
    await db.rateLimitAttempt.update({ where: { key }, data: { resetAt: new Date(Date.now() - 1000) } });

    await expect(assertWithinRateLimit(key, { limit: 1, windowMs: 60_000 })).resolves.toBeUndefined();
  });

  it("reports a retryAfterSeconds roughly matching the window", async () => {
    const key = "test:retry-after";
    await assertWithinRateLimit(key, { limit: 1, windowMs: 60_000 });
    try {
      await assertWithinRateLimit(key, { limit: 1, windowMs: 60_000 });
      throw new Error("expected RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as InstanceType<typeof RateLimitError>).retryAfterSeconds).toBeGreaterThan(0);
      expect((error as InstanceType<typeof RateLimitError>).retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });
});

describe("formatRetryAfter", () => {
  it("formats sub-minute durations in seconds", () => {
    expect(formatRetryAfter(1)).toBe("1 second");
    expect(formatRetryAfter(45)).toBe("45 seconds");
  });

  it("formats longer durations in minutes, rounded up", () => {
    expect(formatRetryAfter(60)).toBe("1 minute");
    expect(formatRetryAfter(90)).toBe("2 minutes");
    expect(formatRetryAfter(600)).toBe("10 minutes");
  });
});
