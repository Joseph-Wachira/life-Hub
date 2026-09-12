import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const encodedSecret = new TextEncoder().encode(env.MOBILE_JWT_SECRET);
const ISSUER = "lifehub-mobile";
const AUDIENCE = "lifehub-mobile-client";

/** Short-lived on purpose: a leaked access token stops working fast, and normal use is masked by the API client's silent refresh (see apps/mobile/src/lib/api/client.ts). */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export class InvalidAccessTokenError extends Error {}

export interface AccessTokenClaims {
  userId: string;
  email: string;
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const token = await new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(encodedSecret);

  return { token, expiresAt };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { issuer: ISSUER, audience: AUDIENCE });
    if (!payload.sub || typeof payload.email !== "string") {
      throw new InvalidAccessTokenError("Malformed access token payload.");
    }
    return { userId: payload.sub, email: payload.email };
  } catch (error) {
    if (error instanceof InvalidAccessTokenError) throw error;
    throw new InvalidAccessTokenError(error instanceof Error ? error.message : "Invalid access token.");
  }
}
