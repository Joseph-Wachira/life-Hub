import type { NextRequest } from "next/server";
import { refreshRequestSchema, type RefreshResponse } from "@lifehub/shared";
import { db } from "@/lib/db";
import { rotateRefreshToken, RefreshTokenError } from "@/lib/mobile/refresh-tokens";
import { signAccessToken } from "@/lib/mobile/jwt";
import { mobileJson, withMobileErrors, unauthorized } from "@/lib/mobile/http";

export const POST = withMobileErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = refreshRequestSchema.safeParse(body);
  if (!parsed.success) throw unauthorized("Missing refresh token.");

  const deviceName = req.headers.get("x-device-name") ?? undefined;

  let rotated: Awaited<ReturnType<typeof rotateRefreshToken>>;
  try {
    rotated = await rotateRefreshToken(parsed.data.refreshToken, deviceName);
  } catch (error) {
    if (error instanceof RefreshTokenError) throw unauthorized(error.message);
    throw error;
  }

  const user = await db.user.findUnique({ where: { id: rotated.userId } });
  if (!user) throw unauthorized("Account no longer exists.");

  const { token: accessToken, expiresAt } = await signAccessToken({ userId: user.id, email: user.email });

  const response: RefreshResponse = {
    tokens: { accessToken, refreshToken: rotated.token, accessTokenExpiresAt: expiresAt.toISOString() },
  };
  return mobileJson(response);
});
