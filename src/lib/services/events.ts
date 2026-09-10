import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  set,
  startOfWeek,
} from "date-fns";
import { db } from "@/lib/db";
import type { Event } from "@prisma/client";

/* ------------------------------------------------------------------ */
/* Recurrence expansion — pure, framework-free, unit-testable         */
/* ------------------------------------------------------------------ */

export type RecurrenceFreq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval?: number;
  /** 0 = Sunday .. 6 = Saturday. Only meaningful for WEEKLY. */
  byWeekday?: number[];
  count?: number;
  /** ISO date string. */
  until?: string;
}

export interface RecurrenceEventInput {
  startAt: Date;
  endAt: Date;
  recurrenceRuleJson?: string | null;
  recurrenceEndAt?: Date | string | null;
}

export interface RecurrenceOccurrence {
  start: Date;
  end: Date;
}

/** Hard safety cap so a malformed/unbounded rule can never spin forever. */
const MAX_ITERATIONS = 3000;

function safeParseRule(json: string): RecurrenceRule | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(parsed.freq)) return null;
    return parsed as RecurrenceRule;
  } catch {
    return null;
  }
}

/** Advance `date` forward by `steps` occurrences of the rule (interval already applied). */
function advanceSteps(date: Date, freq: RecurrenceFreq, interval: number, steps: number): Date {
  const amount = interval * steps;
  if (amount === 0) return date;
  switch (freq) {
    case "DAILY":
      return addDays(date, amount);
    case "WEEKLY":
      return addDays(date, amount * 7);
    case "MONTHLY":
      return addMonths(date, amount);
    case "YEARLY":
      return addYears(date, amount);
  }
}

/** Roughly how many rule-steps fit between two dates (used only to fast-forward, never to decide inclusion). */
function estimateStepsBetween(freq: RecurrenceFreq, interval: number, from: Date, to: Date): number {
  if (to <= from) return 0;
  switch (freq) {
    case "DAILY":
      return Math.floor(differenceInCalendarDays(to, from) / interval);
    case "WEEKLY":
      return Math.floor(differenceInCalendarDays(to, from) / (interval * 7));
    case "MONTHLY":
      return Math.floor(differenceInCalendarMonths(to, from) / interval);
    case "YEARLY":
      return Math.floor(differenceInCalendarYears(to, from) / interval);
  }
}

function withTimeOfDay(day: Date, reference: Date): Date {
  return set(day, {
    hours: reference.getHours(),
    minutes: reference.getMinutes(),
    seconds: reference.getSeconds(),
    milliseconds: reference.getMilliseconds(),
  });
}

function resolveStopAt(rule: RecurrenceRule, recurrenceEndAt?: Date | string | null): Date | null {
  const candidates: Date[] = [];
  if (rule.until) {
    const d = new Date(rule.until);
    if (!isNaN(d.getTime())) candidates.push(d);
  }
  if (recurrenceEndAt) {
    const d = recurrenceEndAt instanceof Date ? recurrenceEndAt : new Date(recurrenceEndAt);
    if (!isNaN(d.getTime())) candidates.push(d);
  }
  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates.map((d) => d.getTime())));
}

/**
 * Expands a (possibly recurring) event into concrete occurrences that overlap
 * [rangeStart, rangeEnd]. Non-recurring events yield at most one occurrence.
 */
export function expandRecurrence(
  event: RecurrenceEventInput,
  rangeStart: Date,
  rangeEnd: Date
): RecurrenceOccurrence[] {
  const durationMs = Math.max(0, event.endAt.getTime() - event.startAt.getTime());
  const results: RecurrenceOccurrence[] = [];
  const overlaps = (start: Date, end: Date) => start <= rangeEnd && end >= rangeStart;

  if (!event.recurrenceRuleJson) {
    if (overlaps(event.startAt, event.endAt)) results.push({ start: event.startAt, end: event.endAt });
    return results;
  }

  const rule = safeParseRule(event.recurrenceRuleJson);
  if (!rule) {
    if (overlaps(event.startAt, event.endAt)) results.push({ start: event.startAt, end: event.endAt });
    return results;
  }

  const interval = rule.interval && rule.interval > 0 ? Math.floor(rule.interval) : 1;
  const stopAt = resolveStopAt(rule, event.recurrenceEndAt);
  const maxCount = rule.count && rule.count > 0 ? Math.floor(rule.count) : null;

  // --- WEEKLY with specific weekdays (e.g. "every Mon/Wed/Fri") ------------
  if (rule.freq === "WEEKLY" && rule.byWeekday && rule.byWeekday.length > 0) {
    const weekdays = Array.from(new Set(rule.byWeekday))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    if (weekdays.length === 0) return results;

    const seriesWeekStart = startOfWeek(event.startAt, { weekStartsOn: 0 });

    // Fast-forward near rangeStart when there's no count to track precisely.
    let blockIndex = 0;
    if (!maxCount) {
      const stepDays = interval * 7;
      const daysToRangeStart = differenceInCalendarDays(rangeStart, seriesWeekStart);
      if (daysToRangeStart > 0) {
        blockIndex = Math.max(0, Math.floor(daysToRangeStart / stepDays) - 2);
      }
    }

    let emitted = 0;
    let iterations = 0;
    let done = false;

    while (iterations < MAX_ITERATIONS && !done) {
      const blockStart = addDays(seriesWeekStart, blockIndex * interval * 7);
      if (stopAt && blockStart > stopAt) break;

      for (const wd of weekdays) {
        iterations++;
        const candidate = withTimeOfDay(addDays(blockStart, wd), event.startAt);
        if (candidate < event.startAt) continue;
        if (stopAt && candidate > stopAt) {
          done = true;
          break;
        }
        if (maxCount && emitted >= maxCount) {
          done = true;
          break;
        }
        emitted++;
        const occEnd = new Date(candidate.getTime() + durationMs);
        if (overlaps(candidate, occEnd)) results.push({ start: candidate, end: occEnd });
        if (candidate > rangeEnd) {
          done = true;
          break;
        }
      }
      blockIndex++;
    }

    results.sort((a, b) => a.start.getTime() - b.start.getTime());
    return results;
  }

  // --- Everything else: DAILY / MONTHLY / YEARLY / plain WEEKLY -----------
  let current = event.startAt;
  let emitted = 0;

  if (!maxCount) {
    const steps = estimateStepsBetween(rule.freq, interval, event.startAt, rangeStart);
    const safeSteps = Math.max(0, steps - 2);
    if (safeSteps > 0) current = advanceSteps(event.startAt, rule.freq, interval, safeSteps);
  }

  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    if (stopAt && current > stopAt) break;
    if (maxCount && emitted >= maxCount) break;
    emitted++;
    const occEnd = new Date(current.getTime() + durationMs);
    if (overlaps(current, occEnd)) results.push({ start: current, end: occEnd });
    if (current > rangeEnd) break;
    current = advanceSteps(current, rule.freq, interval, 1);
  }

  results.sort((a, b) => a.start.getTime() - b.start.getTime());
  return results;
}

/* ------------------------------------------------------------------ */
/* Data access — pure Prisma reads/writes, no auth/session lookups     */
/* ------------------------------------------------------------------ */

export interface CalendarEventInstance {
  /** Stable per-occurrence key: the event id itself for single events, `${eventId}::${startIso}` for recurring ones. */
  instanceId: string;
  event: Event;
  start: Date;
  end: Date;
  isRecurring: boolean;
}

export async function countEvents(workspaceId: string) {
  return db.event.count({ where: { workspaceId } });
}

export async function listEventInstancesInRange(
  workspaceId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarEventInstance[]> {
  const events = await db.event.findMany({
    where: {
      workspaceId,
      startAt: { lte: rangeEnd },
      OR: [
        { recurrenceRuleJson: null, endAt: { gte: rangeStart } },
        {
          recurrenceRuleJson: { not: null },
          OR: [{ recurrenceEndAt: null }, { recurrenceEndAt: { gte: rangeStart } }],
        },
      ],
    },
    orderBy: { startAt: "asc" },
  });

  const instances: CalendarEventInstance[] = [];
  for (const event of events) {
    const isRecurring = Boolean(event.recurrenceRuleJson);
    const occurrences = expandRecurrence(event, rangeStart, rangeEnd);
    for (const occ of occurrences) {
      instances.push({
        instanceId: isRecurring ? `${event.id}::${occ.start.toISOString()}` : event.id,
        event,
        start: occ.start,
        end: occ.end,
        isRecurring,
      });
    }
  }

  instances.sort((a, b) => a.start.getTime() - b.start.getTime());
  return instances;
}

export async function getEventById(workspaceId: string, id: string) {
  return db.event.findFirst({ where: { id, workspaceId } });
}

export interface EventInput {
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  color: string;
  recurrenceRuleJson: string | null;
  recurrenceEndAt: Date | null;
  reminderMinutesBefore: number | null;
}

export async function createEvent(workspaceId: string, data: EventInput) {
  return db.event.create({ data: { ...data, workspaceId } });
}

export async function updateEvent(workspaceId: string, id: string, data: EventInput) {
  const existing = await db.event.findFirst({ where: { id, workspaceId } });
  if (!existing) return null;
  return db.event.update({ where: { id }, data });
}

export async function deleteEvent(workspaceId: string, id: string) {
  const result = await db.event.deleteMany({ where: { id, workspaceId } });
  return result.count > 0;
}

export async function moveEvent(workspaceId: string, id: string, newStart: Date, newEnd: Date) {
  const result = await db.event.updateMany({
    where: { id, workspaceId },
    data: { startAt: newStart, endAt: newEnd },
  });
  return result.count > 0;
}
