import { db } from "@/lib/db";
import type { Mood } from "@prisma/client";

export { computeStreaks } from "@/lib/streaks";

function midnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* -------------------------------------------------------------------------- */
/* Habits                                                                       */
/* -------------------------------------------------------------------------- */

export interface HabitInput {
  name: string;
  icon: string;
  color: string;
  targetPerDay: number;
  daysOfWeek: number[];
  reminderTime?: string | null;
}

export async function listActiveHabits(workspaceId: string) {
  return db.habit.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

/** Habit logs for the last `days` days, for every active habit — used to render heatmaps/streaks in one query. */
export async function listRecentHabitLogs(workspaceId: string, days: number) {
  const since = midnight(new Date());
  since.setDate(since.getDate() - days);
  return db.habitLog.findMany({
    where: { habit: { workspaceId }, date: { gte: since } },
  });
}

export async function createHabit(workspaceId: string, data: HabitInput) {
  return db.habit.create({
    data: {
      workspaceId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      targetPerDay: data.targetPerDay,
      daysOfWeekJson: JSON.stringify(data.daysOfWeek),
      reminderTime: data.reminderTime ?? null,
    },
  });
}

export async function updateHabit(workspaceId: string, habitId: string, data: HabitInput) {
  return db.habit.updateMany({
    where: { id: habitId, workspaceId },
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      targetPerDay: data.targetPerDay,
      daysOfWeekJson: JSON.stringify(data.daysOfWeek),
      reminderTime: data.reminderTime ?? null,
    },
  });
}

export async function archiveHabit(workspaceId: string, habitId: string) {
  return db.habit.updateMany({ where: { id: habitId, workspaceId }, data: { archivedAt: new Date() } });
}

export async function deleteHabit(workspaceId: string, habitId: string) {
  return db.habit.deleteMany({ where: { id: habitId, workspaceId } });
}

/** Toggles today's log for a habit: logs one completion if none exists yet for
 *  today, increments up to targetPerDay, then clears back to zero (removes the row). */
export async function toggleHabitToday(workspaceId: string, habitId: string) {
  const habit = await db.habit.findFirst({ where: { id: habitId, workspaceId } });
  if (!habit) return null;

  const today = midnight(new Date());
  const existing = await db.habitLog.findUnique({ where: { habitId_date: { habitId, date: today } } });

  if (!existing) {
    return db.habitLog.create({ data: { habitId, date: today, completedCount: 1 } });
  }
  if (existing.completedCount < habit.targetPerDay) {
    return db.habitLog.update({ where: { id: existing.id }, data: { completedCount: existing.completedCount + 1 } });
  }
  await db.habitLog.delete({ where: { id: existing.id } });
  return null;
}

/* -------------------------------------------------------------------------- */
/* Mood check-ins                                                               */
/* -------------------------------------------------------------------------- */

export async function getTodayMoodCheckIn(workspaceId: string) {
  return db.moodCheckIn.findUnique({
    where: { workspaceId_date: { workspaceId, date: midnight(new Date()) } },
  });
}

export async function listMoodHistory(workspaceId: string, days: number) {
  const since = midnight(new Date());
  since.setDate(since.getDate() - days);
  return db.moodCheckIn.findMany({
    where: { workspaceId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

export async function upsertMoodCheckIn(
  workspaceId: string,
  data: { mood: Mood; energyLevel: number; note?: string | null }
) {
  const date = midnight(new Date());
  return db.moodCheckIn.upsert({
    where: { workspaceId_date: { workspaceId, date } },
    create: { workspaceId, date, ...data },
    update: data,
  });
}

/* -------------------------------------------------------------------------- */
/* Wellbeing logs                                                              */
/* -------------------------------------------------------------------------- */

export async function getTodayWellbeingLog(workspaceId: string) {
  return db.wellbeingLog.findUnique({
    where: { workspaceId_date: { workspaceId, date: midnight(new Date()) } },
  });
}

export async function listWellbeingHistory(workspaceId: string, days: number) {
  const since = midnight(new Date());
  since.setDate(since.getDate() - days);
  return db.wellbeingLog.findMany({
    where: { workspaceId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

export async function upsertWellbeingLog(
  workspaceId: string,
  data: { sleepHours?: number | null; exerciseMinutes?: number | null; waterMl?: number | null }
) {
  const date = midnight(new Date());
  return db.wellbeingLog.upsert({
    where: { workspaceId_date: { workspaceId, date } },
    create: { workspaceId, date, ...data },
    update: data,
  });
}
