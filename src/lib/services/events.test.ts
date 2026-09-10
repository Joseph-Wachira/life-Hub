import { describe, expect, it } from "vitest";
import { expandRecurrence } from "./events";

describe("expandRecurrence", () => {
  it("passes a non-recurring event through when it overlaps the range", () => {
    const event = {
      startAt: new Date("2026-09-10T09:00:00"),
      endAt: new Date("2026-09-10T10:00:00"),
      recurrenceRuleJson: null,
    };
    const result = expandRecurrence(
      event,
      new Date("2026-09-01T00:00:00"),
      new Date("2026-09-30T23:59:59")
    );
    expect(result).toHaveLength(1);
    expect(result[0].start).toEqual(event.startAt);
    expect(result[0].end).toEqual(event.endAt);
  });

  it("excludes a non-recurring event outside the range", () => {
    const event = {
      startAt: new Date("2026-09-10T09:00:00"),
      endAt: new Date("2026-09-10T10:00:00"),
      recurrenceRuleJson: null,
    };
    const result = expandRecurrence(
      event,
      new Date("2026-10-01T00:00:00"),
      new Date("2026-10-31T23:59:59")
    );
    expect(result).toHaveLength(0);
  });

  it("expands a daily recurrence into one occurrence per day, preserving time and duration", () => {
    const event = {
      startAt: new Date("2026-09-01T09:00:00"),
      endAt: new Date("2026-09-01T09:30:00"),
      recurrenceRuleJson: JSON.stringify({ freq: "DAILY", interval: 1 }),
      recurrenceEndAt: null,
    };
    const rangeStart = new Date("2026-09-10T00:00:00");
    const rangeEnd = new Date("2026-09-16T23:59:59");
    const result = expandRecurrence(event, rangeStart, rangeEnd);

    expect(result).toHaveLength(7);
    const days = result.map((o) => o.start.getDate());
    expect(days).toEqual([10, 11, 12, 13, 14, 15, 16]);
    for (const occ of result) {
      expect(occ.start.getHours()).toBe(9);
      expect(occ.start.getMinutes()).toBe(0);
      expect(occ.end.getTime() - occ.start.getTime()).toBe(30 * 60 * 1000);
    }
  });

  it("respects a daily recurrence's interval > 1 and its recurrenceEndAt", () => {
    const event = {
      startAt: new Date("2026-09-01T09:00:00"),
      endAt: new Date("2026-09-01T09:30:00"),
      recurrenceRuleJson: JSON.stringify({ freq: "DAILY", interval: 2 }),
      recurrenceEndAt: new Date("2026-09-05T23:59:59"),
    };
    const result = expandRecurrence(
      event,
      new Date("2026-09-01T00:00:00"),
      new Date("2026-09-30T23:59:59")
    );
    // Sep 1, 3, 5 — Sep 7 falls after recurrenceEndAt.
    expect(result.map((o) => o.start.getDate())).toEqual([1, 3, 5]);
  });

  it("expands a weekly recurrence restricted to specific weekdays (Mon/Wed/Fri)", () => {
    // 2026-09-01 is a Tuesday.
    const event = {
      startAt: new Date("2026-09-01T08:00:00"),
      endAt: new Date("2026-09-01T08:45:00"),
      recurrenceRuleJson: JSON.stringify({ freq: "WEEKLY", interval: 1, byWeekday: [1, 3, 5] }),
      recurrenceEndAt: null,
    };
    const rangeStart = new Date("2026-09-01T00:00:00");
    const rangeEnd = new Date("2026-09-14T23:59:59");
    const result = expandRecurrence(event, rangeStart, rangeEnd);

    const dates = result.map((o) => `${o.start.getMonth() + 1}-${o.start.getDate()}`);
    // Tue Sep 1 itself is not Mon/Wed/Fri, so the series starts on Wed Sep 2.
    expect(dates).toEqual(["9-2", "9-4", "9-7", "9-9", "9-11", "9-14"]);
    for (const occ of result) {
      expect(occ.start.getHours()).toBe(8);
      expect(occ.start.getMinutes()).toBe(0);
      expect(occ.end.getTime() - occ.start.getTime()).toBe(45 * 60 * 1000);
    }
  });

  it("respects a weekly-by-weekday recurrence far from the series start (fast-forward path)", () => {
    const event = {
      startAt: new Date("2026-01-06T09:00:00"), // Tuesday
      endAt: new Date("2026-01-06T09:15:00"),
      recurrenceRuleJson: JSON.stringify({ freq: "WEEKLY", interval: 1, byWeekday: [1, 2, 3, 4, 5] }),
      recurrenceEndAt: new Date("2026-12-31T23:59:59"),
    };
    const rangeStart = new Date("2026-09-07T00:00:00"); // a Monday
    const rangeEnd = new Date("2026-09-13T23:59:59"); // following Sunday
    const result = expandRecurrence(event, rangeStart, rangeEnd);

    // Weekday standup: Mon-Fri that week, 5 occurrences.
    expect(result).toHaveLength(5);
    expect(result.map((o) => o.start.getDate())).toEqual([7, 8, 9, 10, 11]);
  });

  it("returns an empty array once a recurring series has fully ended before the range", () => {
    const event = {
      startAt: new Date("2026-01-01T09:00:00"),
      endAt: new Date("2026-01-01T09:30:00"),
      recurrenceRuleJson: JSON.stringify({ freq: "WEEKLY", interval: 1 }),
      recurrenceEndAt: new Date("2026-02-01T00:00:00"),
    };
    const result = expandRecurrence(
      event,
      new Date("2026-06-01T00:00:00"),
      new Date("2026-06-30T23:59:59")
    );
    expect(result).toHaveLength(0);
  });
});
