"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import {
  getUserPasswordHash,
  updateNotificationPreference,
  updateUserPassword,
  updateUserProfile,
  updateUserSettings,
} from "@/lib/services/settings";
import {
  changePasswordSchema,
  updateNotificationPrefsSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from "@/lib/validations/settings";
import type { ActionResult } from "@/lib/actions/auth";

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await requireWorkspace();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  await updateUserProfile(userId, {
    name: parsed.data.name,
    image: parsed.data.image ? parsed.data.image : null,
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updatePreferencesAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await requireWorkspace();

  const parsed = updatePreferencesSchema.safeParse({
    theme: formData.get("theme"),
    timezone: formData.get("timezone"),
    weekStartsOn: formData.get("weekStartsOn"),
    currency: formData.get("currency"),
    pomodoroWorkMinutes: formData.get("pomodoroWorkMinutes"),
    pomodoroShortBreakMinutes: formData.get("pomodoroShortBreakMinutes"),
    pomodoroLongBreakMinutes: formData.get("pomodoroLongBreakMinutes"),
    sessionsBeforeLongBreak: formData.get("sessionsBeforeLongBreak"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  await updateUserSettings(userId, parsed.data);

  revalidatePath("/settings");
  return { success: true };
}

export async function updateNotificationPrefsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await requireWorkspace();

  const parsed = updateNotificationPrefsSchema.safeParse({
    eventReminders: formData.get("eventReminders") === "on",
    taskReminders: formData.get("taskReminders") === "on",
    billReminders: formData.get("billReminders") === "on",
    habitReminders: formData.get("habitReminders") === "on",
    goalUpdates: formData.get("goalUpdates") === "on",
    defaultReminderMinutes: formData.get("defaultReminderMinutes"),
    quietHoursStart: formData.get("quietHoursStart"),
    quietHoursEnd: formData.get("quietHoursEnd"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { quietHoursStart, quietHoursEnd, ...rest } = parsed.data;
  await updateNotificationPreference(userId, {
    ...rest,
    quietHoursStart: quietHoursStart ? quietHoursStart : null,
    quietHoursEnd: quietHoursEnd ? quietHoursEnd : null,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await requireWorkspace();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const currentHash = await getUserPasswordHash(userId);
  if (!currentHash) {
    return { error: "This account doesn't have password sign-in set up." };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, currentHash);
  if (!isValid) {
    return { error: "Current password is incorrect." };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await updateUserPassword(userId, newHash);

  return { success: true };
}
