// @vitest-environment node
//
// jose's key-type check does a realm-sensitive `instanceof Uint8Array`; under
// the project-wide jsdom environment, TextEncoder().encode() and jose's
// internal Uint8Array come from different realms and the check fails even
// though the value is a genuine Uint8Array. This file has no DOM
// dependency, so run it under plain Node instead.
import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken, InvalidAccessTokenError } from "./jwt";

describe("mobile access tokens", () => {
  it("round-trips a signed token", async () => {
    const { token, expiresAt } = await signAccessToken({ userId: "user_1", email: "demo@lifehub.app" });
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const claims = await verifyAccessToken(token);
    expect(claims).toEqual({ userId: "user_1", email: "demo@lifehub.app" });
  });

  it("rejects a token with a tampered signature", async () => {
    const { token } = await signAccessToken({ userId: "user_1", email: "demo@lifehub.app" });
    const [header, payload, signature] = token.split(".");
    // Flip the FIRST character, not the last: base64url's final group of a
    // 256-bit HMAC carries 2 unused padding bits, so flipping the last
    // character can occasionally decode to the exact same signature bytes
    // and make this test flake. Every earlier character fully encodes real
    // bits, so a flip there is guaranteed to change the decoded signature.
    const flippedSignature = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
    const tampered = `${header}.${payload}.${flippedSignature}`;

    await expect(verifyAccessToken(tampered)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it("rejects a token signed with a different secret", async () => {
    // Simulates a token forged without knowing MOBILE_JWT_SECRET.
    const { SignJWT } = await import("jose");
    const foreignSecret = new TextEncoder().encode("a-completely-different-32-byte-secret!!");
    const forged = await new SignJWT({ email: "demo@lifehub.app" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_1")
      .setIssuedAt()
      .setIssuer("lifehub-mobile")
      .setAudience("lifehub-mobile-client")
      .setExpirationTime("15m")
      .sign(foreignSecret);

    await expect(verifyAccessToken(forged)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it("rejects an expired token", async () => {
    const { SignJWT } = await import("jose");
    const { env } = await import("@/lib/env");
    const secret = new TextEncoder().encode(env.MOBILE_JWT_SECRET);
    const expired = await new SignJWT({ email: "demo@lifehub.app" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_1")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setIssuer("lifehub-mobile")
      .setAudience("lifehub-mobile-client")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secret);

    await expect(verifyAccessToken(expired)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it("rejects garbage input", async () => {
    await expect(verifyAccessToken("not-a-jwt")).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });
});
