"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import * as habitsService from "@/lib/services/habits";
import { habitFormSchema, moodCheckInSchema, wellbeingLogSchema } from "@/lib/validations/habits";
import type { ActionResult } from "@/lib/actions/auth";

function revalidateHabits() {
  revalidatePath("/habits");
}

export async function createHabitAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = habitFormSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
    color: formData.get("color") || undefined,
    targetPerDay: formData.get("targetPerDay") || undefined,
    daysOfWeek: formData.getAll("daysOfWeek"),
    reminderTime: formData.get("reminderTime") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  await habitsService.createHabit(workspace.id, parsed.data);
  revalidateHabits();
  return { success: true };
}

export async function updateHabitAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing habit." };

  const parsed = habitFormSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
    color: formData.get("color") || undefined,
    targetPerDay: formData.get("targetPerDay") || undefined,
    daysOfWeek: formData.getAll("daysOfWeek"),
    reminderTime: formData.get("reminderTime") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  await habitsService.updateHabit(workspace.id, id, parsed.data);
  revalidateHabits();
  return { success: true };
}

export async function archiveHabitAction(habitId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await habitsService.archiveHabit(workspace.id, habitId);
  revalidateHabits();
  return { success: true };
}

export async function deleteHabitAction(habitId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await habitsService.deleteHabit(workspace.id, habitId);
  revalidateHabits();
  return { success: true };
}

export async function toggleHabitTodayAction(habitId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await habitsService.toggleHabitToday(workspace.id, habitId);
  revalidateHabits();
  return { success: true };
}

export async function upsertMoodCheckInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = moodCheckInSchema.safeParse({
    mood: formData.get("mood"),
    energyLevel: formData.get("energyLevel"),
    note: formData.get("note") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  await habitsService.upsertMoodCheckIn(workspace.id, parsed.data);
  revalidateHabits();
  return { success: true };
}

export async function upsertWellbeingLogAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const raw = {
    sleepHours: formData.get("sleepHours"),
    exerciseMinutes: formData.get("exerciseMinutes"),
    waterMl: formData.get("waterMl"),
  };
  const cleaned = {
    sleepHours: raw.sleepHours ? String(raw.sleepHours) : undefined,
    exerciseMinutes: raw.exerciseMinutes ? String(raw.exerciseMinutes) : undefined,
    waterMl: raw.waterMl ? String(raw.waterMl) : undefined,
  };

  const parsed = wellbeingLogSchema.safeParse(cleaned);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  await habitsService.upsertWellbeingLog(workspace.id, parsed.data);
  revalidateHabits();
  return { success: true };
}
