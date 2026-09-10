import { describe, expect, it } from "vitest";
import { subtaskProgress } from "./subtask-progress";

describe("subtaskProgress", () => {
  it("returns 0/0 when there are no subtasks", () => {
    expect(subtaskProgress([])).toEqual({ done: 0, total: 0 });
  });

  it("counts only DONE subtasks as complete", () => {
    const subtasks = [
      { status: "DONE" },
      { status: "TODO" },
      { status: "IN_PROGRESS" },
      { status: "DONE" },
      { status: "ARCHIVED" },
    ];
    expect(subtaskProgress(subtasks)).toEqual({ done: 2, total: 5 });
  });

  it("reports all done when every subtask is DONE", () => {
    const subtasks = [{ status: "DONE" }, { status: "DONE" }];
    expect(subtaskProgress(subtasks)).toEqual({ done: 2, total: 2 });
  });
});
