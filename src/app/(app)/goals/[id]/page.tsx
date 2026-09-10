import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, FolderKanban, ListChecks } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { getGoalDetail, computeGoalProgress } from "@/lib/services/goals";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalEditForm } from "@/components/goals/goal-edit-form";
import { MilestoneList } from "@/components/goals/milestone-list";
import { GoalStatusActions } from "@/components/goals/goal-status-actions";
import { GOAL_CATEGORY_META } from "@/components/goals/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Goal" };

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const goal = await getGoalDetail(workspace.id, id);
  if (!goal) notFound();

  const progress = computeGoalProgress(goal);
  const categoryMeta = GOAL_CATEGORY_META[goal.category];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/goals"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" /> Back to goals
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-[var(--radius-md)] text-white"
            style={{ backgroundColor: goal.color }}
          >
            <categoryMeta.icon className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{goal.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {categoryMeta.label}
              {goal.targetDate && ` · Target ${formatDate(goal.targetDate)}`}
            </p>
          </div>
        </div>
        <GoalStatusActions goalId={goal.id} status={goal.status} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-[var(--muted-foreground)]">{progress}%</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalEditForm goal={goal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4" /> Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList goalId={goal.id} milestones={goal.milestones} />
        </CardContent>
      </Card>

      {(goal.tasks.length > 0 || goal.projects.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-4" /> Linked work
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {goal.projects.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Projects</p>
                {goal.projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </div>
                ))}
              </div>
            )}
            {goal.tasks.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Tasks</p>
                {goal.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    {t.status === "DONE" ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-[var(--success)]" />
                    ) : (
                      <span className="size-2 shrink-0 rounded-full bg-[var(--border-strong)]" />
                    )}
                    <span className={t.status === "DONE" ? "text-[var(--subtle-foreground)] line-through" : ""}>
                      {t.title}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {t.status.replace("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
