import { describe, expect, it } from "vitest";
import { computeGoalProgress } from "./goals";

describe("computeGoalProgress", () => {
  it("computes progress from milestones when the goal has any", () => {
    const progress = computeGoalProgress({
      milestones: [
        { completedAt: new Date() },
        { completedAt: new Date() },
        { completedAt: null },
        { completedAt: null },
      ],
      // Tasks are present too, but milestones take priority and should be ignored.
      tasks: [{ status: "DONE" }, { status: "DONE" }, { status: "DONE" }],
    });
    expect(progress).toBe(50);
  });

  it("falls back to non-archived linked tasks when there are no milestones", () => {
    const progress = computeGoalProgress({
      milestones: [],
      tasks: [{ status: "DONE" }, { status: "DONE" }, { status: "TODO" }, { status: "ARCHIVED" }],
    });
    // 2 done out of 3 non-archived tasks (the archived one is excluded entirely) = 66.6% -> 67
    expect(progress).toBe(67);
  });

  it("returns 0 when there are neither milestones nor linked tasks", () => {
    expect(computeGoalProgress({ milestones: [], tasks: [] })).toBe(0);
  });

  it("returns 0 when the only linked tasks are archived", () => {
    expect(computeGoalProgress({ milestones: [], tasks: [{ status: "ARCHIVED" }] })).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    const progress = computeGoalProgress({
      milestones: [{ completedAt: new Date() }, { completedAt: null }, { completedAt: null }],
      tasks: [],
    });
    // 1/3 = 33.33... -> 33
    expect(progress).toBe(33);
  });
});
