import type { NextRequest } from "next/server";
import type { MobileNotification } from "@lifehub/shared";
import { listRecentNotifications } from "@/lib/services/notifications";
import { syncDueNotifications } from "@/lib/services/notification-sync";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { toMobileNotification } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  // Mirrors the web app's authenticated layout: there's no background
  // scheduler, so "sweep for due reminders" happens on read.
  await syncDueNotifications(userId);
  const notifications = await listRecentNotifications(userId, 50);
  return mobileJson<MobileNotification[]>(notifications.map(toMobileNotification));
});
