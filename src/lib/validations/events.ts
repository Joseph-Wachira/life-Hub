import { z } from "zod";

/** Small fixed swatch palette for the color picker. */
export const EVENT_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
] as const;

export const DEFAULT_EVENT_COLOR: (typeof EVENT_COLORS)[number] = "#6366f1";

export const RECURRENCE_FREQ_OPTIONS = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type RecurrenceFreqOption = (typeof RECURRENCE_FREQ_OPTIONS)[number];

export const RECURRENCE_FREQ_LABELS: Record<RecurrenceFreqOption, string> = {
  NONE: "Does not repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const REMINDER_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "No reminder" },
  { value: "0", label: "At time of event" },
  { value: "10", label: "10 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_FULL_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const eventFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").nullable(),
  location: z.string().trim().max(200, "Location is too long").nullable(),
  allDay: z.boolean(),
  startAt: z.date().refine((d) => !isNaN(d.getTime()), "Enter a valid start date/time"),
  endAt: z.date().refine((d) => !isNaN(d.getTime()), "Enter a valid end date/time"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
  recurrenceFreq: z.enum(RECURRENCE_FREQ_OPTIONS),
  recurrenceInterval: z.number().int().min(1, "Interval must be at least 1").max(365, "Interval is too large"),
  recurrenceByWeekday: z.array(z.number().int().min(0).max(6)),
  recurrenceUntil: z
    .date()
    .nullable()
    .refine((d) => d === null || !isNaN(d.getTime()), "Enter a valid end date"),
  reminderMinutesBefore: z.number().int().min(0, "Reminder must be 0 or more minutes").nullable(),
});

export interface ParsedEventForm {
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  startAt: Date;
  endAt: Date;
  color: string;
  recurrenceRuleJson: string | null;
  recurrenceEndAt: Date | null;
  reminderMinutesBefore: number | null;
}

export type ParseEventFormResult = { success: true; data: ParsedEventForm } | { success: false; error: string };

function nullableString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : null;
}

/**
 * Reads a create/edit event <form>'s FormData and validates it, translating
 * the UI's recurrence + reminder fields into the shape the Event model stores.
 */
export function parseEventFormData(formData: FormData): ParseEventFormResult {
  const allDay = formData.get("allDay") === "on" || formData.get("allDay") === "true";

  const rawStart = String(formData.get("startAt") ?? "");
  const rawEnd = String(formData.get("endAt") ?? "");
  if (!rawStart || !rawEnd) {
    return { success: false, error: "Please choose a start and end." };
  }

  const startAt = allDay ? new Date(`${rawStart}T00:00:00`) : new Date(rawStart);
  const endAt = allDay ? new Date(`${rawEnd}T23:59:59`) : new Date(rawEnd);
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    return { success: false, error: "Please enter valid start and end times." };
  }
  if (endAt < startAt) {
    return { success: false, error: "End must be after start." };
  }

  const recurrenceFreqRaw = String(formData.get("recurrenceFreq") ?? "NONE");
  const recurrenceFreq: RecurrenceFreqOption = (RECURRENCE_FREQ_OPTIONS as readonly string[]).includes(
    recurrenceFreqRaw
  )
    ? (recurrenceFreqRaw as RecurrenceFreqOption)
    : "NONE";

  const recurrenceIntervalRaw = Number(formData.get("recurrenceInterval") ?? 1);
  const recurrenceInterval =
    Number.isFinite(recurrenceIntervalRaw) && recurrenceIntervalRaw > 0 ? Math.floor(recurrenceIntervalRaw) : 1;

  const recurrenceByWeekday = formData
    .getAll("recurrenceByWeekday")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  const recurrenceUntilRaw = String(formData.get("recurrenceUntil") ?? "");
  const recurrenceUntil = recurrenceUntilRaw ? new Date(`${recurrenceUntilRaw}T23:59:59`) : null;
  if (recurrenceUntil && isNaN(recurrenceUntil.getTime())) {
    return { success: false, error: "Enter a valid recurrence end date." };
  }

  const reminderRaw = String(formData.get("reminderMinutesBefore") ?? "none");
  const reminderMinutesBefore = reminderRaw === "none" || reminderRaw === "" ? null : Number(reminderRaw);
  if (reminderMinutesBefore !== null && !Number.isFinite(reminderMinutesBefore)) {
    return { success: false, error: "Pick a valid reminder." };
  }

  const parsed = eventFieldsSchema.safeParse({
    title: formData.get("title"),
    description: nullableString(formData.get("description")),
    location: nullableString(formData.get("location")),
    allDay,
    startAt,
    endAt,
    color: String(formData.get("color") || DEFAULT_EVENT_COLOR),
    recurrenceFreq,
    recurrenceInterval,
    recurrenceByWeekday,
    recurrenceUntil,
    reminderMinutesBefore,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the event details." };
  }

  const v = parsed.data;
  let recurrenceRuleJson: string | null = null;
  if (v.recurrenceFreq !== "NONE") {
    const rule: { freq: string; interval: number; byWeekday?: number[]; until?: string } = {
      freq: v.recurrenceFreq,
      interval: v.recurrenceInterval,
    };
    if (v.recurrenceFreq === "WEEKLY" && v.recurrenceByWeekday.length > 0) {
      rule.byWeekday = [...v.recurrenceByWeekday].sort((a, b) => a - b);
    }
    if (v.recurrenceUntil) rule.until = v.recurrenceUntil.toISOString();
    recurrenceRuleJson = JSON.stringify(rule);
  }

  return {
    success: true,
    data: {
      title: v.title,
      description: v.description,
      location: v.location,
      allDay: v.allDay,
      startAt: v.startAt,
      endAt: v.endAt,
      color: v.color,
      recurrenceRuleJson,
      recurrenceEndAt: v.recurrenceFreq !== "NONE" ? v.recurrenceUntil : null,
      reminderMinutesBefore: v.reminderMinutesBefore,
    },
  };
}
