import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name your workspace").max(60),
  type: z.enum(["PERSONAL", "WORK", "SCHOOL", "FAMILY", "SIDE_PROJECT"]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
