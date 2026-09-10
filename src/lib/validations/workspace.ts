import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name your workspace").max(60),
  type: z.enum(["PERSONAL", "WORK", "SCHOOL", "FAMILY", "SIDE_PROJECT"]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name your workspace").max(60),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
