import { z } from "zod";

export const projectStatusSchema = z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  status: projectStatusSchema.default("ACTIVE"),
  color: z.string().trim().min(1).default("#6366f1"),
  goalId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  startAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  dueAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export const PROJECT_COLOR_OPTIONS = [
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
] as const;
