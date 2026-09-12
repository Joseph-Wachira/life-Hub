import { db } from "@/lib/db";
import { expandRecurrence } from "@/lib/services/events";
import { sendExpoPushToUser } from "@/lib/services/push";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function ensureNotification(input: {
  userId: string;
  workspaceId: string;
  type: "EVENT_REMINDER" | "TASK_DUE" | "BILL_DUE" | "HABIT_REMINDER";
  title: string;
  body?: string;
  entityType: string;
  entityId: string;
  scheduledFor: Date;
}) {
  const exists = await db.notification.findFirst({
    where: { userId: input.userId, entityType: input.entityType, entityId: input.entityId },
    select: { id: true },
  });
  if (exists) return;

  await db.notification.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
      scheduledFor: input.scheduledFor,
    },
  });

  // Best-effort: a push failure (no registered device, Expo service hiccup,
  // etc.) must never break in-app notification creation, which is the part
  // that's actually relied upon today.
  try {
    await sendExpoPushToUser(input.userId, { title: input.title, body: input.body });
  } catch (error) {
    console.error("[notifications] push send failed", error);
  }
}

/**
 * Scans a user's workspaces for things that need a reminder right now (due
 * tasks, upcoming event reminders, bills coming due, un-logged habits past
 * their reminder time) and materializes Notification rows for anything not
 * already notified. Cheap and idempotent — safe to call on every page load
 * for an app this size; there's no background scheduler in this
 * architecture, so this "sync on read" is the pragmatic substitute.
 */
export async function syncDueNotifications(userId: string): Promise<void> {
  const prefs = await db.notificationPreference.findUnique({ where: { userId } });
  const eventReminders = prefs?.eventReminders ?? true;
  const taskReminders = prefs?.taskReminders ?? true;
  const billReminders = prefs?.billReminders ?? true;
  const habitReminders = prefs?.habitReminders ?? true;

  if (!eventReminders && !taskReminders && !billReminders && !habitReminders) return;

  const workspaces = await db.workspace.findMany({ where: { userId }, select: { id: true } });
  const now = new Date();
  const today = dayKey(now);
  const todayWeekday = now.getDay();

  for (const { id: workspaceId } of workspaces) {
    if (taskReminders) {
      const dueSoon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tasks = await db.task.findMany({
        where: {
          workspaceId,
          status: { notIn: ["DONE", "ARCHIVED"] },
          dueAt: { lte: dueSoon },
        },
        select: { id: true, title: true, dueAt: true },
      });
      for (const task of tasks) {
        const overdue = task.dueAt! < now;
        await ensureNotification({
          userId,
          workspaceId,
          type: "TASK_DUE",
          title: overdue ? `"${task.title}" is overdue` : `"${task.title}" is due soon`,
          entityType: "Task",
          entityId: task.id,
          scheduledFor: task.dueAt!,
        });
      }
    }

    if (eventReminders) {
      const events = await db.event.findMany({
        where: { workspaceId, reminderMinutesBefore: { not: null } },
      });
      const rangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      for (const event of events) {
        const occurrences = expandRecurrence(event, now, rangeEnd);
        const next = occurrences.find((occ) => occ.start >= now);
        if (!next) continue;
        const minutesUntil = (next.start.getTime() - now.getTime()) / 60000;
        if (minutesUntil <= (event.reminderMinutesBefore ?? 0)) {
          await ensureNotification({
            userId,
            workspaceId,
            type: "EVENT_REMINDER",
            title: `"${event.title}" starts ${minutesUntil <= 1 ? "now" : `in ${Math.round(minutesUntil)} min`}`,
            entityType: "Event",
            entityId: `${event.id}::${next.start.toISOString()}`,
            scheduledFor: next.start,
          });
        }
      }
    }

    if (billReminders) {
      const bills = await db.recurringBill.findMany({ where: { workspaceId } });
      for (const bill of bills) {
        const daysUntil = Math.floor((bill.nextDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (daysUntil <= bill.reminderDaysBefore) {
          await ensureNotification({
            userId,
            workspaceId,
            type: "BILL_DUE",
            title: daysUntil < 0 ? `"${bill.name}" is overdue` : daysUntil === 0 ? `"${bill.name}" is due today` : `"${bill.name}" is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
            entityType: "RecurringBill",
            entityId: `${bill.id}:${dayKey(bill.nextDueDate)}`,
            scheduledFor: bill.nextDueDate,
          });
        }
      }
    }

    if (habitReminders) {
      const habits = await db.habit.findMany({ where: { workspaceId, archivedAt: null, reminderTime: { not: null } } });
      for (const habit of habits) {
        const daysOfWeek: number[] = JSON.parse(habit.daysOfWeekJson);
        if (!daysOfWeek.includes(todayWeekday)) continue;

        const [h, m] = habit.reminderTime!.split(":").map(Number);
        const reminderAt = new Date(now);
        reminderAt.setHours(h, m, 0, 0);
        if (now < reminderAt) continue;

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const log = await db.habitLog.findUnique({ where: { habitId_date: { habitId: habit.id, date: todayStart } } });
        if (log && log.completedCount >= habit.targetPerDay) continue;

        await ensureNotification({
          userId,
          workspaceId,
          type: "HABIT_REMINDER",
          title: `Don't forget: ${habit.name}`,
          entityType: "Habit",
          entityId: `${habit.id}:${today}`,
          scheduledFor: reminderAt,
        });
      }
    }
  }
}
