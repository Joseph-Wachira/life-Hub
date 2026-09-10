import { describe, expect, it } from "vitest";
import { formatClock, nextPhase } from "./phase";

describe("nextPhase", () => {
  it("goes to a short break after a focus session that isn't a multiple of the cycle", () => {
    expect(nextPhase("focus", 1, 4)).toBe("short_break");
    expect(nextPhase("focus", 2, 4)).toBe("short_break");
    expect(nextPhase("focus", 3, 4)).toBe("short_break");
  });

  it("goes to a long break once the sessions-before-long-break count is reached", () => {
    expect(nextPhase("focus", 4, 4)).toBe("long_break");
  });

  it("keeps repeating the cycle forever using the running total (no manual reset needed)", () => {
    expect(nextPhase("focus", 5, 4)).toBe("short_break");
    expect(nextPhase("focus", 8, 4)).toBe("long_break");
    expect(nextPhase("focus", 12, 4)).toBe("long_break");
  });

  it("always returns to focus after either kind of break", () => {
    expect(nextPhase("short_break", 3, 4)).toBe("focus");
    expect(nextPhase("long_break", 4, 4)).toBe("focus");
  });

  it("treats a sessionsBeforeLongBreak of 1 as a long break after every focus session", () => {
    expect(nextPhase("focus", 1, 1)).toBe("long_break");
    expect(nextPhase("focus", 2, 1)).toBe("long_break");
  });

  it("guards against a zero/invalid sessionsBeforeLongBreak by treating it as 1", () => {
    expect(nextPhase("focus", 1, 0)).toBe("long_break");
  });

  it("never treats zero completed sessions as a long-break trigger", () => {
    expect(nextPhase("focus", 0, 4)).toBe("short_break");
  });
});

describe("formatClock", () => {
  it("formats seconds as MM:SS", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(1500)).toBe("25:00");
  });

  it("formats an hour or more as H:MM:SS", () => {
    expect(formatClock(3661)).toBe("1:01:01");
  });

  it("never returns a negative duration", () => {
    expect(formatClock(-10)).toBe("00:00");
  });
});
