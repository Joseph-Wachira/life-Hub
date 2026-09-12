import type {
  User,
  Workspace,
  Event as EventRecord,
  FocusSession,
  Category,
  Transaction,
  Budget,
  Note,
  Tag,
  Notification,
} from "@prisma/client";
import type {
  MobileUser,
  MobileWorkspace,
  MobileTask,
  MobileEventOccurrence,
  MobileFocusSession,
  MobileHabit,
  MobileCategory,
  MobileTransaction,
  MobileBudget,
  MobileNote,
  MobileNotification,
} from "@lifehub/shared";
import type { TaskWithRelations } from "@/lib/services/tasks";
import type { CalendarEventInstance } from "@/lib/services/events";
import type { HabitWithProgress } from "@/lib/services/habits";

/**
 * Prisma model -> JSON-safe mobile DTO mappers. Centralized so every route
 * that returns a user/workspace/etc. shapes it identically — see
 * src/app/api/mobile/v1/README.md for the response contract these feed.
 */

export function toMobileUser(user: Pick<User, "id" | "name" | "email" | "image">): MobileUser {
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

export function toMobileWorkspace(
  workspace: Pick<Workspace, "id" | "name" | "type" | "color" | "icon" | "isDefault">
): MobileWorkspace {
  return {
    id: workspace.id,
    name: workspace.name,
    type: workspace.type,
    color: workspace.color,
    icon: workspace.icon,
    isDefault: workspace.isDefault,
  };
}

export function toMobileTask(task: TaskWithRelations): MobileTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    projectId: task.projectId,
    project: task.project,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toMobileEventInstance(instance: CalendarEventInstance): MobileEventOccurrence {
  return {
    instanceId: instance.instanceId,
    eventId: instance.event.id,
    title: instance.event.title,
    description: instance.event.description,
    location: instance.event.location,
    start: instance.start.toISOString(),
    end: instance.end.toISOString(),
    allDay: instance.event.allDay,
    color: instance.event.color,
    isRecurring: instance.isRecurring,
  };
}

/** Single-record view (no recurrence expansion) — used for get-by-id and right after create. */
export function toMobileEventRecord(event: EventRecord): MobileEventOccurrence {
  return {
    instanceId: event.id,
    eventId: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    start: event.startAt.toISOString(),
    end: event.endAt.toISOString(),
    allDay: event.allDay,
    color: event.color,
    isRecurring: Boolean(event.recurrenceRuleJson),
  };
}

export function toMobileFocusSession(
  session: FocusSession,
  task: { id: string; title: string } | null = null
): MobileFocusSession {
  return {
    id: session.id,
    type: session.type,
    plannedMinutes: session.plannedMinutes,
    actualMinutes: session.actualMinutes,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    taskId: session.taskId,
    task,
    interruptions: session.interruptions,
    notes: session.notes,
    rating: session.rating,
  };
}

export function toMobileHabit({ habit, todayCompletedCount, streak }: HabitWithProgress): MobileHabit {
  return {
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    targetPerDay: habit.targetPerDay,
    daysOfWeek: JSON.parse(habit.daysOfWeekJson),
    reminderTime: habit.reminderTime,
    todayCompletedCount,
    doneToday: todayCompletedCount >= habit.targetPerDay,
    streak,
  };
}

export function toMobileCategory(category: Category): MobileCategory {
  return { id: category.id, name: category.name, type: category.type, color: category.color, icon: category.icon };
}

export function toMobileTransaction(transaction: Transaction & { category: Category | null }): MobileTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    amountCents: transaction.amountCents,
    currency: transaction.currency,
    description: transaction.description,
    occurredAt: transaction.occurredAt.toISOString(),
    category: transaction.category ? toMobileCategory(transaction.category) : null,
  };
}

export function toMobileBudget(budget: Budget & { category: Category; spentCents: number }): MobileBudget {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    category: toMobileCategory(budget.category),
    monthlyLimitCents: budget.monthlyLimitCents,
    spentCents: budget.spentCents,
  };
}

export function toMobileNote(note: Note & { tags: Tag[] }): MobileNote {
  return {
    id: note.id,
    title: note.title,
    contentMd: note.contentMd,
    isPinned: note.isPinned,
    folderId: note.folderId,
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
  };
}

export function toMobileNotification(notification: Notification): MobileNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    scheduledFor: notification.scheduledFor.toISOString(),
    entityType: notification.entityType,
    entityId: notification.entityId,
  };
}
