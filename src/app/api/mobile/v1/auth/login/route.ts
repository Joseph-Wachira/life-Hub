import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import type { LoginResponse } from "@lifehub/shared";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { listWorkspaces } from "@/lib/services/workspace";
import { signAccessToken } from "@/lib/mobile/jwt";
import { issueRefreshToken } from "@/lib/mobile/refresh-tokens";
import { toMobileUser, toMobileWorkspace } from "@/lib/mobile/dto";
import { extractClientIp } from "@/lib/request-ip";
import { assertWithinRateLimit, RateLimitError, formatRetryAfter } from "@/lib/rate-limit";
import { mobileJson, withMobileErrors, badRequest, unauthorized, tooManyRequests } from "@/lib/mobile/http";

export const POST = withMobileErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Enter a valid email and password.", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { email, password } = parsed.data;

  try {
    await assertWithinRateLimit(`login:email:${email}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    const ip = extractClientIp((name) => req.headers.get(name));
    await assertWithinRateLimit(`login:ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw tooManyRequests(`Too many attempts. Try again in ${formatRetryAfter(error.retryAfterSeconds)}.`);
    }
    throw error;
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("Invalid email or password.");
  }

  const deviceName = req.headers.get("x-device-name") ?? undefined;
  const [{ token: accessToken, expiresAt }, { token: refreshToken }, workspaces] = await Promise.all([
    signAccessToken({ userId: user.id, email: user.email }),
    issueRefreshToken(user.id, deviceName),
    listWorkspaces(user.id),
  ]);

  const response: LoginResponse = {
    user: toMobileUser(user),
    workspaces: workspaces.map(toMobileWorkspace),
    tokens: { accessToken, refreshToken, accessTokenExpiresAt: expiresAt.toISOString() },
  };
  return mobileJson(response);
});
