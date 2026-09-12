import type { NextRequest } from "next/server";
import { refreshRequestSchema } from "@lifehub/shared";
import { revokeRefreshToken } from "@/lib/mobile/refresh-tokens";
import { mobileJson, withMobileErrors } from "@/lib/mobile/http";

// Deliberately lenient: signing out should always "succeed" from the
// client's point of view, even if the refresh token was already expired,
// revoked, or missing from the request body.
export const POST = withMobileErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = refreshRequestSchema.safeParse(body);
  if (parsed.success) await revokeRefreshToken(parsed.data.refreshToken);
  return mobileJson({ ok: true });
});
