import "@testing-library/jest-dom/vitest";

// Safe fallbacks so any test that transitively imports src/lib/env.ts
// (e.g. src/lib/mobile/jwt.ts) doesn't fail purely on missing environment
// variables — real values win via `??=` if the environment already has them.
process.env.DATABASE_URL ??= "file:./dev.db";
process.env.AUTH_SECRET ??= "test-only-secret-not-for-production-use-00000000";
process.env.MOBILE_JWT_SECRET ??= "test-only-mobile-secret-not-for-production-use-00000000";
