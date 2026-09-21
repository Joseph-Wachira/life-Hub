import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password · Life Hub" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Enter your email and we&apos;ll send you a link to get back in.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
