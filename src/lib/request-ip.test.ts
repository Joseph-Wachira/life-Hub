import { describe, expect, it } from "vitest";
import { extractClientIp } from "./request-ip";

function headerMap(headers: Record<string, string>) {
  return (name: string) => headers[name] ?? null;
}

describe("extractClientIp", () => {
  it("takes the first address from x-forwarded-for", () => {
    expect(extractClientIp(headerMap({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("trims whitespace around the first address", () => {
    expect(extractClientIp(headerMap({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(extractClientIp(headerMap({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to \"unknown\" when neither header is present", () => {
    expect(extractClientIp(headerMap({}))).toBe("unknown");
  });
});
