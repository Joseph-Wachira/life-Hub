"use server";

import { auth } from "@/auth";
import {
  countUnreadNotifications,
  listRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications";

export async function listNotificationsAction() {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    listRecentNotifications(session.user.id),
    countUnreadNotifications(session.user.id),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await markNotificationRead(session.user.id, id);
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await markAllNotificationsRead(session.user.id);
}
