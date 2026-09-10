import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]);

export const subtaskInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Subtask needs a title").max(200),
  done: z.boolean().default(false),
});

export const attachmentLinkInputSchema = z.object({
  id: z.string().optional(),
  fileName: z.string().trim().min(1, "Give the link a name").max(120),
  fileUrl: z.string().trim().url("Enter a valid URL"),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  priority: taskPrioritySchema.default("MEDIUM"),
  status: taskStatusSchema.default("TODO"),
  dueAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  projectId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  goalId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  tagIds: z.array(z.string()).default([]),
  subtasks: z.array(subtaskInputSchema).default([]),
  attachments: z.array(attachmentLinkInputSchema).default([]),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(40),
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  status: taskStatusSchema,
  position: z.number(),
});

export const taskFiltersSchema = z.object({
  search: z.string().trim().optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().optional(),
  tagId: z.string().optional(),
  includeArchived: z.boolean().default(false),
});
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
