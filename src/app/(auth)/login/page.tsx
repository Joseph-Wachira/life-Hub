import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · Life Hub" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Sign in to pick up right where you left off.
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[var(--brand)] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
