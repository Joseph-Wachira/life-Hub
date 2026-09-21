"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { env } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/email";
import { extractClientIp } from "@/lib/request-ip";
import { assertWithinRateLimit, RateLimitError, formatRetryAfter } from "@/lib/rate-limit";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/services/password-reset";
import { loginSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validations/auth";

export type ActionResult = { error: string } | { success: true };

async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return extractClientIp((name) => requestHeaders.get(name));
}

const RATE_LIMIT_MESSAGE = (retryAfterSeconds: number) =>
  `Too many attempts. Try again in ${formatRetryAfter(retryAfterSeconds)}.`;

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }

  try {
    await assertWithinRateLimit(`register:ip:${await getClientIp()}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) return { error: RATE_LIMIT_MESSAGE(error.retryAfterSeconds) };
    throw error;
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      settings: { create: {} },
      notificationPref: { create: {} },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw error;
  }

  return { success: true };
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }

  try {
    // Per-email first: a credential-stuffing run against one account should
    // trip that account's lock without waiting to also exceed the coarser
    // per-IP one (which mainly catches guessing spread across many emails).
    await assertWithinRateLimit(`login:email:${parsed.data.email}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    await assertWithinRateLimit(`login:ip:${await getClientIp()}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) return { error: RATE_LIMIT_MESSAGE(error.retryAfterSeconds) };
    throw error;
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return { success: true };
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  try {
    await assertWithinRateLimit(`reset:email:${parsed.data.email}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    await assertWithinRateLimit(`reset:ip:${await getClientIp()}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) return { error: RATE_LIMIT_MESSAGE(error.retryAfterSeconds) };
    throw error;
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always report success whether or not the account exists, so this form
  // can't be used to test which emails have an account — same rationale as
  // loginAction's single generic error message.
  if (user?.passwordHash) {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(user.email, `${baseUrl}/reset-password?token=${token}`);
  }

  return { success: true };
}

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash } }),
    // A password reset is a strong signal the account may have been
    // compromised, so sign out every mobile device too — the same response
    // a replayed refresh token gets in rotateRefreshToken().
    db.mobileSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  return { success: true };
}
