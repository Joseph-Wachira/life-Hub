import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: { label: string; direction?: "up" | "down" | "neutral" };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-muted)] text-[var(--brand)]">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend.direction === "up" && "text-[var(--success)]",
            trend.direction === "down" && "text-[var(--danger)]",
            (!trend.direction || trend.direction === "neutral") && "text-[var(--subtle-foreground)]"
          )}
        >
          {trend.label}
        </p>
      )}
    </div>
  );
}
