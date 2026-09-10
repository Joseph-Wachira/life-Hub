import { z } from "zod";

export const habitFormSchema = z.object({
  name: z.string().trim().min(1, "Name your habit").max(60),
  icon: z.string().trim().min(1).default("check-circle"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color")
    .default("#6366f1"),
  targetPerDay: z.coerce.number().int().min(1).max(20).default(1),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Pick at least one day"),
  reminderTime: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type HabitFormInput = z.infer<typeof habitFormSchema>;

export const moodCheckInSchema = z.object({
  mood: z.enum(["VERY_LOW", "LOW", "NEUTRAL", "GOOD", "GREAT"]),
  energyLevel: z.coerce.number().int().min(1).max(5),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type MoodCheckInInput = z.infer<typeof moodCheckInSchema>;

export const wellbeingLogSchema = z.object({
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  exerciseMinutes: z.coerce.number().int().min(0).max(600).optional(),
  waterMl: z.coerce.number().int().min(0).max(10000).optional(),
});
export type WellbeingLogInput = z.infer<typeof wellbeingLogSchema>;
