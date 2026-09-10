import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 sm:p-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-[var(--brand-foreground)]">
            <Sparkles className="size-4" />
          </span>
          Life Hub
        </Link>

        <div className="mx-auto w-full max-w-sm py-16">{children}</div>

        <p className="text-xs text-[var(--subtle-foreground)]">
          © {new Date().getFullYear()} Life Hub. All rights reserved.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-[var(--brand)] lg:block">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(1 0 0 / 0.18), transparent 40%), radial-gradient(circle at 80% 70%, oklch(1 0 0 / 0.14), transparent 45%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12 text-[var(--brand-foreground)]">
          <blockquote className="max-w-md text-2xl font-medium leading-snug">
            “Everything I manage — my schedule, my goals, my money, my mind — finally lives in one calm place.”
          </blockquote>
          <p className="mt-4 text-sm opacity-80">A Life Hub member, six weeks in</p>
        </div>
      </div>
    </div>
  );
}
