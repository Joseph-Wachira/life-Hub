import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate, pluralize } from "@/lib/utils";
import { GOAL_STATUS_META } from "./constants";
import type { GoalCategory, GoalStatus } from "@prisma/client";

export interface GoalListItem {
  id: string;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  color: string;
  targetDate: Date | null;
  milestones: { completedAt: Date | null }[];
  tasks: { status: string }[];
  progress: number;
}

export function GoalCard({ goal }: { goal: GoalListItem }) {
  const statusMeta = GOAL_STATUS_META[goal.status];
  const hasMilestones = goal.milestones.length > 0;
  const completedMilestones = goal.milestones.filter((m) => m.completedAt !== null).length;
  const nonArchivedTasks = goal.tasks.filter((t) => t.status !== "ARCHIVED");
  const doneTasks = nonArchivedTasks.filter((t) => t.status === "DONE").length;

  const subtitle = hasMilestones
    ? `${completedMilestones}/${goal.milestones.length} ${pluralize(goal.milestones.length, "milestone")}`
    : nonArchivedTasks.length > 0
      ? `${doneTasks}/${nonArchivedTasks.length} ${pluralize(nonArchivedTasks.length, "task")}`
      : "No milestones yet";

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
            <h3 className="truncate font-medium leading-tight">{goal.title}</h3>
          </div>
          {goal.status !== "ACTIVE" && (
            <Badge variant={statusMeta.badgeVariant} className="shrink-0">
              {statusMeta.label}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{subtitle}</span>
            <span className="font-medium text-[var(--foreground)]">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} />
        </div>

        {goal.targetDate && (
          <div className="mt-auto flex items-center gap-1.5 text-xs text-[var(--subtle-foreground)]">
            <Calendar className="size-3.5" />
            <span>Target {formatDate(goal.targetDate)}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
