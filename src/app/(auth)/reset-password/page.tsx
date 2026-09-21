import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password · Life Hub" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Choose a new password for your account.</p>
      </div>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-[var(--danger)]">
          This reset link is missing its token.{" "}
          <Link href="/forgot-password" className="font-medium text-[var(--brand)] hover:underline">
            Request a new one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
