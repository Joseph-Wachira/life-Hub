import { z } from "zod";

export const GOAL_CATEGORY_VALUES = [
  "PERSONAL",
  "FINANCIAL",
  "FITNESS",
  "CAREER",
  "LEARNING",
] as const;

export const GOAL_STATUS_VALUES = ["ACTIVE", "COMPLETED", "ABANDONED"] as const;

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, "Give your goal a title").max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(GOAL_CATEGORY_VALUES),
  targetDate: z.string().trim().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color")
    .optional(),
});

export const updateGoalSchema = createGoalSchema.extend({
  goalId: z.string().min(1, "Missing goal id"),
});

export const createMilestoneSchema = z.object({
  goalId: z.string().min(1, "Missing goal id"),
  title: z.string().trim().min(1, "Milestone needs a title").max(200),
  dueAt: z.string().trim().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
