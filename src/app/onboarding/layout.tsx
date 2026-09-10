import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 sm:px-10">
      <Link href="/" className="mb-10 flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-[var(--brand-foreground)]">
          <Sparkles className="size-4" />
        </span>
        Life Hub
      </Link>
      <div className="flex flex-1 items-start justify-center">{children}</div>
    </div>
  );
}
