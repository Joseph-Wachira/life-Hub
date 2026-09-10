import { db } from "@/lib/db";
import type { UpdateNotificationPrefsInput, UpdatePreferencesInput } from "@/lib/validations/settings";

export async function getUserProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });
}

export async function updateUserProfile(userId: string, data: { name: string; image: string | null }) {
  return db.user.update({
    where: { id: userId },
    data: { name: data.name, image: data.image },
  });
}

/** Reads the user's preferences, creating a row with defaults if one doesn't exist yet. */
export async function getUserSettings(userId: string) {
  return db.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateUserSettings(userId: string, data: UpdatePreferencesInput) {
  return db.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

/** Reads the user's notification preferences, creating a row with defaults if one doesn't exist yet. */
export async function getNotificationPreference(userId: string) {
  return db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateNotificationPreference(
  userId: string,
  data: Omit<UpdateNotificationPrefsInput, "quietHoursStart" | "quietHoursEnd"> & {
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }
) {
  return db.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function getUserPasswordHash(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return user?.passwordHash ?? null;
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db.user.update({ where: { id: userId }, data: { passwordHash } });
}
