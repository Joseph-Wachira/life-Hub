import crypto from "node:crypto";
import { db } from "@/lib/db";

const RESET_TOKEN_TTL_MINUTES = 60;
const RESET_TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a fresh reset token for a user, invalidating any still-unused
 * tokens from earlier requests so only the most recent link works. Only the
 * hash is persisted (mirrors MobileSession.refreshTokenHash); the raw token
 * is returned once, for the caller to put in the emailed link.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return token;
}

/**
 * Verifies a reset token and marks it used in one step, so it can never be
 * redeemed twice. Returns the userId to reset on success, or null if the
 * token is unknown, already used, or expired.
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
