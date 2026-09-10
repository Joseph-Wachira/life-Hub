import { describe, expect, it } from "vitest";
import { centsToDollarsInput, parseDollarsToCents } from "./finance";

describe("parseDollarsToCents", () => {
  it("parses a whole-dollar amount", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
  });

  it("parses a decimal amount", () => {
    expect(parseDollarsToCents("19.99")).toBe(1999);
  });

  it("rounds to the nearest cent", () => {
    expect(parseDollarsToCents("12.345")).toBe(1235);
  });

  it("strips a leading dollar sign and thousands separators", () => {
    expect(parseDollarsToCents("$1,240.50")).toBe(124050);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseDollarsToCents("  42.00  ")).toBe(4200);
  });

  it("returns NaN for empty input", () => {
    expect(parseDollarsToCents("")).toBeNaN();
  });

  it("returns NaN for non-numeric input", () => {
    expect(parseDollarsToCents("not a number")).toBeNaN();
  });

  it("returns NaN for a malformed number", () => {
    expect(parseDollarsToCents("12.34.56")).toBeNaN();
  });
});

describe("centsToDollarsInput", () => {
  it("formats cents back into a two-decimal dollar string", () => {
    expect(centsToDollarsInput(124050)).toBe("1240.50");
    expect(centsToDollarsInput(500)).toBe("5.00");
  });
});
