import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account · Life Hub" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Set up your personal operating system in under a minute.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
