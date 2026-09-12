import { eachDayOfInterval, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { db } from "@/lib/db";

export type FocusSessionTypeValue = "POMODORO" | "DEEP_WORK" | "CUSTOM";

export interface FocusTimerSettings {
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

export const DEFAULT_FOCUS_SETTINGS: FocusTimerSettings = {
  pomodoroWorkMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

/** Reads the pomodoro-related fields off UserSettings, falling back to sane defaults. */
export async function getUserFocusSettings(userId: string): Promise<FocusTimerSettings> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: {
      pomodoroWorkMinutes: true,
      pomodoroShortBreakMinutes: true,
      pomodoroLongBreakMinutes: true,
      sessionsBeforeLongBreak: true,
    },
  });
  if (!settings) return DEFAULT_FOCUS_SETTINGS;
  return {
    pomodoroWorkMinutes: settings.pomodoroWorkMinutes,
    pomodoroShortBreakMinutes: settings.pomodoroShortBreakMinutes,
    pomodoroLongBreakMinutes: settings.pomodoroLongBreakMinutes,
    sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
  };
}

/** Open (not done/archived) tasks in the workspace, for the "attach a task" picker. */
export async function listOpenTasks(workspaceId: string) {
  return db.task.findMany({
    where: { workspaceId, status: { in: ["TODO", "IN_PROGRESS"] } },
    select: { id: true, title: true, status: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

/** Confirms a task both exists and belongs to this workspace before we link a session to it. */
export async function getOpenTaskById(workspaceId: string, taskId: string) {
  return db.task.findFirst({ where: { id: taskId, workspaceId } });
}

export interface CreateFocusSessionInput {
  workspaceId: string;
  userId: string;
  type: FocusSessionTypeValue;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: Date;
  endedAt: Date;
  taskId?: string;
  interruptions: number;
  notes?: string;
  rating?: number;
}

export async function createFocusSession(input: CreateFocusSessionInput) {
  return db.focusSession.create({ data: input });
}

export interface StartFocusSessionData {
  workspaceId: string;
  userId: string;
  type: FocusSessionTypeValue;
  plannedMinutes: number;
  taskId?: string;
}

/**
 * Records a session as started right now, with no end time yet. Used by the
 * mobile app so a timer survives the app being backgrounded or killed: the
 * server holds the start time, and the client only needs to resume counting
 * from `startedAt` rather than carry the whole timer in memory. The web
 * timer instead calls `createFocusSession` once, after the fact, with a
 * complete record — both are valid ways to use the same table.
 */
export async function startFocusSession(data: StartFocusSessionData) {
  return db.focusSession.create({
    data: {
      workspaceId: data.workspaceId,
      userId: data.userId,
      type: data.type,
      plannedMinutes: data.plannedMinutes,
      actualMinutes: 0,
      startedAt: new Date(),
      taskId: data.taskId,
    },
  });
}

export async function getFocusSessionById(workspaceId: string, id: string) {
  return db.focusSession.findFirst({ where: { id, workspaceId } });
}

export interface EndFocusSessionData {
  actualMinutes: number;
  interruptions?: number;
  rating?: number;
  notes?: string;
}

export async function endFocusSession(id: string, data: EndFocusSessionData) {
  return db.focusSession.update({
    where: { id },
    data: {
      endedAt: new Date(),
      actualMinutes: data.actualMinutes,
      interruptions: data.interruptions ?? 0,
      rating: data.rating,
      notes: data.notes,
    },
  });
}

export async function listRecentFocusSessions(workspaceId: string, take = 20) {
  return db.focusSession.findMany({
    where: { workspaceId },
    orderBy: { startedAt: "desc" },
    take,
    include: { task: { select: { id: true, title: true } } },
  });
}

export interface FocusAnalytics {
  sessionsToday: number;
  weekMinutes: number;
  averageRating: number | null;
  dailyMinutes: { date: string; label: string; minutes: number }[];
}

/**
 * Bundles the numbers the analytics section needs: today's session count,
 * this week's total focused minutes, the average self-rating, and a 14-day
 * daily-minutes series for the bar chart.
 */
export async function getFocusAnalytics(workspaceId: string, now: Date = new Date()): Promise<FocusAnalytics> {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const rangeStart = startOfDay(subDays(now, 13));

  const [sessionsToday, weekAgg, ratingAgg, rangeSessions] = await Promise.all([
    db.focusSession.count({ where: { workspaceId, startedAt: { gte: todayStart } } }),
    db.focusSession.aggregate({
      where: { workspaceId, startedAt: { gte: weekStart } },
      _sum: { actualMinutes: true },
    }),
    db.focusSession.aggregate({
      where: { workspaceId, rating: { not: null } },
      _avg: { rating: true },
    }),
    db.focusSession.findMany({
      where: { workspaceId, startedAt: { gte: rangeStart } },
      select: { startedAt: true, actualMinutes: true },
    }),
  ]);

  const days = eachDayOfInterval({ start: rangeStart, end: now });
  const buckets = new Map<string, number>();
  for (const day of days) buckets.set(format(day, "yyyy-MM-dd"), 0);

  for (const session of rangeSessions) {
    const key = format(startOfDay(session.startedAt), "yyyy-MM-dd");
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + session.actualMinutes);
    }
  }

  const dailyMinutes = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return { date: key, label: format(day, "EEE d"), minutes: buckets.get(key) ?? 0 };
  });

  return {
    sessionsToday,
    weekMinutes: weekAgg._sum.actualMinutes ?? 0,
    averageRating: ratingAgg._avg.rating,
    dailyMinutes,
  };
}
