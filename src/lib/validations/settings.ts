import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  image: z
    .string()
    .trim()
    .max(2048, "URL is too long")
    .refine((value) => value === "" || /^https?:\/\/.+/.test(value), {
      message: "Enter a valid image URL",
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
  weekStartsOn: z.coerce.number().int().min(0, "Invalid day").max(6, "Invalid day"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD"),
  pomodoroWorkMinutes: z.coerce.number().int().min(1, "Must be at least 1 minute").max(180, "Too long"),
  pomodoroShortBreakMinutes: z.coerce.number().int().min(1, "Must be at least 1 minute").max(60, "Too long"),
  pomodoroLongBreakMinutes: z.coerce.number().int().min(1, "Must be at least 1 minute").max(120, "Too long"),
  sessionsBeforeLongBreak: z.coerce.number().int().min(1, "Must be at least 1").max(12, "Too many"),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

const optionalTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format")
  .optional()
  .or(z.literal(""));

export const updateNotificationPrefsSchema = z.object({
  eventReminders: z.boolean(),
  taskReminders: z.boolean(),
  billReminders: z.boolean(),
  habitReminders: z.boolean(),
  goalUpdates: z.boolean(),
  defaultReminderMinutes: z.coerce.number().int().min(0, "Must be 0 or more").max(1440, "Too long"),
  quietHoursStart: optionalTime,
  quietHoursEnd: optionalTime,
});

export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
