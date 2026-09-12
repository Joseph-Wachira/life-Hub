import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  // Deliberately separate from AUTH_SECRET: it signs bearer tokens handed to
  // mobile clients rather than the httpOnly session cookie Auth.js manages,
  // so a leak or rotation of one secret can't be confused with the other.
  MOBILE_JWT_SECRET: z.string().min(32, "MOBILE_JWT_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  MOBILE_JWT_SECRET: process.env.MOBILE_JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  const flat = parsed.error.flatten().fieldErrors;
  const message = Object.entries(flat)
    .map(([key, value]) => `${key}: ${(value ?? []).join(", ")}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${message}`);
}

export const env = parsed.data;
