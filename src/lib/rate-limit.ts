import { db } from "@/lib/db";

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many attempts. Please try again later.");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Fixed-window rate limiter: `key` may be called at most `limit` times per
 * `windowMs`, after which it throws RateLimitError until the window rolls
 * over. See RateLimitAttempt in prisma/schema.prisma for why this is
 * database-backed rather than an in-memory counter.
 *
 * Call this BEFORE doing the expensive/sensitive work it's guarding (a
 * bcrypt compare, a DB write) so a client that's already over the limit
 * doesn't get to spend that cost anyway.
 */
export async function assertWithinRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<void> {
  const now = new Date();

  const { count, resetAt } = await db.$transaction(async (tx) => {
    const existing = await tx.rateLimitAttempt.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      const nextResetAt = new Date(now.getTime() + windowMs);
      await tx.rateLimitAttempt.upsert({
        where: { key },
        update: { count: 1, resetAt: nextResetAt },
        create: { key, count: 1, resetAt: nextResetAt },
      });
      return { count: 1, resetAt: nextResetAt };
    }

    const updated = await tx.rateLimitAttempt.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { count: updated.count, resetAt: existing.resetAt };
  });

  if (count > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)));
  }
}

/** "3 minutes", "45 seconds", etc — for a human-readable retry message. */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
