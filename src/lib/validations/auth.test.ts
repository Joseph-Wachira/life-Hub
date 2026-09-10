import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({ email: "Jordan@Example.com", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jordan@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires a strong password", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "jordan@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "jordan@example.com",
      password: "Sup3rSecret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name that is too short", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "jordan@example.com",
      password: "Sup3rSecret",
    });
    expect(result.success).toBe(false);
  });
});
