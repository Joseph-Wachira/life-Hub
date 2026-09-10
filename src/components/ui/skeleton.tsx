import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-sunken)]", className)}
      {...props}
    />
  );
}
