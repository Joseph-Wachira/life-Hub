import type { NextRequest } from "next/server";
import { markAllNotificationsRead } from "@/lib/services/notifications";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { mobileJson, withMobileErrors } from "@/lib/mobile/http";

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const { count } = await markAllNotificationsRead(userId);
  return mobileJson({ ok: true, count });
});
