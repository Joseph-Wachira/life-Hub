import { z } from "zod";

export const onboardingSchema = z.object({
  focusAreas: z
    .array(z.enum(["WORK", "EDUCATION", "PERSONAL", "FINANCES", "HEALTH"]))
    .min(1, "Choose at least one area to manage"),
  role: z.string().trim().max(40).optional(),
  workspaceName: z.string().trim().min(2, "Name your workspace").max(60),
  workspaceType: z.enum(["PERSONAL", "WORK", "SCHOOL", "FAMILY", "SIDE_PROJECT"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
