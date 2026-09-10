import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Here&apos;s your day at a glance.
      </p>
    </div>
  );
}
