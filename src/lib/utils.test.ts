import { describe, expect, it } from "vitest";
import { clamp, formatCurrency, initials, pluralize, positionBetween } from "./utils";

describe("formatCurrency", () => {
  it("formats cents as a currency string", () => {
    expect(formatCurrency(124000)).toBe("$1,240.00");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$5.00");
  });
});

describe("initials", () => {
  it("returns the first letter of up to two words", () => {
    expect(initials("Jordan Rivera")).toBe("JR");
  });

  it("falls back to a question mark when no name is given", () => {
    expect(initials(null)).toBe("?");
  });
});

describe("clamp", () => {
  it("keeps values within range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("pluralize", () => {
  it("pluralizes based on count", () => {
    expect(pluralize(1, "task")).toBe("task");
    expect(pluralize(2, "task")).toBe("tasks");
  });
});

describe("positionBetween", () => {
  it("returns a midpoint between two positions", () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });

  it("handles insertion at the start or end of a list", () => {
    expect(positionBetween(null, 1000)).toBe(0);
    expect(positionBetween(1000, null)).toBe(2000);
    expect(positionBetween(null, null)).toBe(1000);
  });
});
