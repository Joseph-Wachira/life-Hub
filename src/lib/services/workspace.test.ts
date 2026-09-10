import { describe, expect, it } from "vitest";
import { canDeleteWorkspace } from "./workspace";

const two = [
  { id: "w1", isDefault: true },
  { id: "w2", isDefault: false },
];

describe("canDeleteWorkspace", () => {
  it("allows deleting a non-default workspace when others exist", () => {
    expect(canDeleteWorkspace(two, "w2")).toEqual({ ok: true });
  });

  it("blocks deleting the default workspace", () => {
    expect(canDeleteWorkspace(two, "w1")).toEqual({
      ok: false,
      reason: "Set a different workspace as default before deleting this one.",
    });
  });

  it("blocks deleting the user's only workspace, even if it isn't flagged default", () => {
    const solo = [{ id: "w1", isDefault: false }];
    expect(canDeleteWorkspace(solo, "w1")).toEqual({
      ok: false,
      reason: "You can't delete your only workspace.",
    });
  });

  it("reports a missing workspace as not found", () => {
    expect(canDeleteWorkspace(two, "missing")).toEqual({ ok: false, reason: "Workspace not found." });
  });
});
