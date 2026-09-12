import type { NextRequest } from "next/server";
import { z } from "zod";
import { registerPushTokenSchema } from "@lifehub/shared";
import { registerPushToken, unregisterPushToken } from "@/lib/services/push";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = registerPushTokenSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  await registerPushToken(userId, parsed.data.token, parsed.data.platform, parsed.data.deviceName);
  return mobileJson({ ok: true }, 201);
});

const deleteBodySchema = z.object({ token: z.string().min(1) });

export const DELETE = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = deleteBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("token is required.");

  await unregisterPushToken(userId, parsed.data.token);
  return mobileJson({ ok: true });
});
