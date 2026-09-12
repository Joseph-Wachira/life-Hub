import type { NextRequest } from "next/server";
import { markNotificationRead } from "@/lib/services/notifications";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { mobileJson, withMobileErrors, notFound } from "@/lib/mobile/http";

export const PATCH = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const { count } = await markNotificationRead(userId, id);
  if (count === 0) throw notFound("Notification not found.");
  return mobileJson({ ok: true });
});
