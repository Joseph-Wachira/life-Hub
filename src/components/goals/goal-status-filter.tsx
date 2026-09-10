import Link from "next/link";
import { cn } from "@/lib/utils";
import { GOAL_STATUS_META, GOAL_STATUS_ORDER } from "./constants";
import type { GoalStatus } from "@prisma/client";

export function GoalStatusFilter({ current }: { current: GoalStatus }) {
  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-1">
      {GOAL_STATUS_ORDER.map((status) => {
        const active = status === current;
        return (
          <Link
            key={status}
            href={`/goals?status=${status}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              active
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {GOAL_STATUS_META[status].label}
          </Link>
        );
      })}
    </div>
  );
}
