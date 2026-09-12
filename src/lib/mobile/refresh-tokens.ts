import crypto from "node:crypto";
import { db } from "@/lib/db";

const REFRESH_TOKEN_TTL_DAYS = 30;
const REFRESH_TOKEN_BYTES = 32;

export class RefreshTokenError extends Error {}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

function newExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Called once at login. Only the SHA-256 hash is ever persisted (see prisma/schema.prisma MobileSession). */
export async function issueRefreshToken(userId: string, deviceName?: string) {
  const token = generateOpaqueToken();
  const expiresAt = newExpiry();
  await db.mobileSession.create({
    data: { userId, refreshTokenHash: hashToken(token), deviceName, expiresAt },
  });
  return { token, expiresAt };
}

/**
 * Verifies a refresh token and rotates it in one step: the presented
 * session is revoked and a fresh token/session pair takes its place, so a
 * token can only ever be redeemed once. If a token that's already revoked
 * is presented again, that can only mean it was copied and is being
 * replayed by someone else — so every active session for that user is
 * revoked as a precaution, forcing a fresh sign-in everywhere.
 */
export async function rotateRefreshToken(
  token: string,
  deviceName?: string
): Promise<{ userId: string; token: string; expiresAt: Date }> {
  const tokenHash = hashToken(token);
  const session = await db.mobileSession.findUnique({ where: { refreshTokenHash: tokenHash } });

  if (!session) throw new RefreshTokenError("Unknown refresh token.");

  if (session.revokedAt) {
    await db.mobileSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new RefreshTokenError("Refresh token reuse detected; all sessions for this account were revoked.");
  }

  if (session.expiresAt.getTime() < Date.now()) {
    throw new RefreshTokenError("Refresh token expired.");
  }

  const nextToken = generateOpaqueToken();
  const expiresAt = newExpiry();

  await db.$transaction([
    db.mobileSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    }),
    db.mobileSession.create({
      data: {
        userId: session.userId,
        refreshTokenHash: hashToken(nextToken),
        deviceName: deviceName ?? session.deviceName,
        expiresAt,
      },
    }),
  ]);

  return { userId: session.userId, token: nextToken, expiresAt };
}

/** Used by sign-out. No-ops silently on an already-revoked/unknown token, since the client's goal ("this token must not work") is already satisfied. */
export async function revokeRefreshToken(token: string): Promise<void> {
  await db.mobileSession.updateMany({
    where: { refreshTokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
