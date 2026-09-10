import { z } from "zod";

export const FOCUS_SESSION_TYPES = ["POMODORO", "DEEP_WORK", "CUSTOM"] as const;

const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

/** Submitted (as FormData) once a focus phase ends, naturally or manually. */
export const logFocusSessionSchema = z.object({
  type: z.enum(FOCUS_SESSION_TYPES),
  plannedMinutes: z.coerce.number().int().min(1, "Planned duration is required").max(600),
  actualMinutes: z.coerce.number().int().min(0).max(600),
  startedAt: z.string().min(1, "Missing start time"),
  endedAt: z.string().min(1, "Missing end time"),
  taskId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  interruptions: z.coerce.number().int().min(0).max(999),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  rating: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(5).optional()),
});

export type LogFocusSessionInput = z.infer<typeof logFocusSessionSchema>;
