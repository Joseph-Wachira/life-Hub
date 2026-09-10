import { db } from "@/lib/db";

export async function listRecentNotifications(userId: string, take = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: [{ isRead: "asc" }, { scheduledFor: "desc" }],
    take,
  });
}

export async function countUnreadNotifications(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } });
}

export async function markNotificationRead(userId: string, id: string) {
  return db.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
