import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streaks";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

describe("computeStreaks", () => {
  it("counts a currently-active streak ending today", () => {
    // Wed Jan 8, Thu Jan 9, Fri Jan 10 (2025) logged; today = Fri Jan 10.
    const logged = [d(2025, 1, 8), d(2025, 1, 9), d(2025, 1, 10)];
    const result = computeStreaks(logged, ALL_DAYS, d(2025, 1, 10));
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("breaks the current streak across a gap but remembers the longest run", () => {
    // Logged Jan 1-3 (streak of 3), gap on Jan 4, logged again Jan 6 only.
    // Today is Jan 6 — current streak should be 1, longest should be 3.
    const logged = [d(2025, 1, 1), d(2025, 1, 2), d(2025, 1, 3), d(2025, 1, 6)];
    const result = computeStreaks(logged, ALL_DAYS, d(2025, 1, 6));
    expect(result.longest).toBe(3);
    expect(result.current).toBe(1);
  });

  it("ignores inactive days of the week entirely", () => {
    // Weekday-only habit: Fri Jan 3, then Mon Jan 6 logged (weekend skipped, not a gap).
    const logged = [d(2025, 1, 3), d(2025, 1, 6)];
    const result = computeStreaks(logged, WEEKDAYS, d(2025, 1, 6));
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });

  it("returns zeros when nothing has ever been logged", () => {
    expect(computeStreaks([], ALL_DAYS, d(2025, 1, 10))).toEqual({ current: 0, longest: 0 });
  });
});
