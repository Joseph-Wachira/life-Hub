import { z } from "zod";

/**
 * Request-body contracts for src/app/api/mobile/v1/**. These are deliberately
 * separate from src/lib/validations/*.ts on the web app: those parse
 * `FormData` (empty-string-means-unset, string dates, etc.) while mobile
 * sends JSON, so dates coerce straight to `Date` and optional fields are
 * genuinely optional rather than `""`. Enums/limits are kept identical to
 * their web counterparts on purpose — see AGENTS-facing note in each route.
 * Shared here (rather than duplicated) so the mobile client can run the same
 * validation before it ever hits the network.
 */

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const pushTokenPlatformSchema = z.enum(["ios", "android"]);

export const registerPushTokenSchema = z.object({
  token: z.string().min(1).max(400),
  platform: pushTokenPlatformSchema,
  deviceName: z.string().trim().max(120).optional(),
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(4000).optional(),
  priority: taskPrioritySchema.default("MEDIUM"),
  status: taskStatusSchema.default("TODO"),
  dueAt: z.coerce.date().optional(),
  projectId: z.string().min(1).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  dueAt: z.coerce.date().nullable().optional(),
  projectId: z.string().min(1).nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskQuerySchema = z.object({
  workspaceId: z.string().min(1),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  allDay: z.boolean().default(false),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const eventRangeQuerySchema = z.object({
  workspaceId: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

export const focusSessionTypeSchema = z.enum(["POMODORO", "DEEP_WORK", "CUSTOM"]);

export const startFocusSessionSchema = z.object({
  type: focusSessionTypeSchema.default("POMODORO"),
  plannedMinutes: z.coerce.number().int().min(1).max(600),
  taskId: z.string().min(1).optional(),
});
export type StartFocusSessionInput = z.infer<typeof startFocusSessionSchema>;

export const endFocusSessionSchema = z.object({
  actualMinutes: z.coerce.number().int().min(0).max(600),
  interruptions: z.coerce.number().int().min(0).max(999).default(0),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type EndFocusSessionInput = z.infer<typeof endFocusSessionSchema>;

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amountCents: z.coerce.number().int().positive(),
  categoryId: z.string().min(1).optional(),
  description: z.string().trim().max(200).optional(),
  occurredAt: z.coerce.date(),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const transactionsQuerySchema = z.object({
  workspaceId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const createNoteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  contentMd: z.string().max(200_000).optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  contentMd: z.string().max(200_000).optional(),
  isPinned: z.boolean().optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const notesQuerySchema = z.object({
  workspaceId: z.string().min(1),
  q: z.string().trim().max(200).optional(),
  onlyPinned: z.coerce.boolean().optional(),
});
