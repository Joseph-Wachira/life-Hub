/**
 * JSON-safe DTOs returned by src/app/api/mobile/v1/**. "JSON-safe" means every
 * Date has already become an ISO-8601 string — these are the shapes the
 * mobile app actually receives over the wire, not the Prisma model shapes.
 */

export type WorkspaceType = "PERSONAL" | "WORK" | "SCHOOL" | "FAMILY" | "SIDE_PROJECT";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
export type FocusSessionType = "POMODORO" | "DEEP_WORK" | "CUSTOM";
export type TransactionType = "INCOME" | "EXPENSE";
export type NotificationType =
  | "EVENT_REMINDER"
  | "TASK_DUE"
  | "BILL_DUE"
  | "HABIT_REMINDER"
  | "GOAL_MILESTONE"
  | "SYSTEM";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface MobileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface MobileWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** ISO timestamp the access token stops being accepted. */
  accessTokenExpiresAt: string;
}

export interface LoginResponse {
  user: MobileUser;
  workspaces: MobileWorkspace[];
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

export interface MeResponse {
  user: MobileUser;
  workspaces: MobileWorkspace[];
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface MobileTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export interface MobileEventOccurrence {
  /** Stable id for this occurrence: the event id, or `${eventId}::${startIso}` for a recurring instance. */
  instanceId: string;
  eventId: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  isRecurring: boolean;
}

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

export interface MobileFocusSession {
  id: string;
  type: FocusSessionType;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: string;
  endedAt: string | null;
  taskId: string | null;
  task: { id: string; title: string } | null;
  interruptions: number;
  notes: string | null;
  rating: number | null;
}

export interface FocusSettings {
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export interface MobileHabit {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerDay: number;
  daysOfWeek: number[];
  reminderTime: string | null;
  todayCompletedCount: number;
  doneToday: boolean;
  streak: { current: number; longest: number };
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface MobileCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface MobileTransaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  currency: string;
  description: string | null;
  occurredAt: string;
  category: MobileCategory | null;
}

export interface MobileBudget {
  id: string;
  categoryId: string;
  category: MobileCategory;
  monthlyLimitCents: number;
  spentCents: number;
}

export interface MobileBillDue {
  id: string;
  name: string;
  amountCents: number;
  nextDueDate: string;
}

export interface FinanceSnapshot {
  monthStart: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  budgets: MobileBudget[];
  billsDueSoon: MobileBillDue[];
  categories: MobileCategory[];
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface MobileNote {
  id: string;
  title: string;
  contentMd: string;
  isPinned: boolean;
  folderId: string | null;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface MobileNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  scheduledFor: string;
  entityType: string | null;
  entityId: string | null;
}

// ---------------------------------------------------------------------------
// Today dashboard aggregate
// ---------------------------------------------------------------------------

export interface TodaySummary {
  agenda: MobileEventOccurrence[];
  priorityTasks: MobileTask[];
  overdueTaskCount: number;
  habits: MobileHabit[];
  focus: { sessionsToday: number; weekMinutes: number };
  finance: { netCents: number; incomeCents: number; expenseCents: number; overBudgetCount: number };
}

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
