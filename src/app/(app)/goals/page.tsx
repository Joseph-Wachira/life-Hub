import type { Metadata } from "next";
import { Target } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { listGoals, computeGoalProgress } from "@/lib/services/goals";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalStatusFilter } from "@/components/goals/goal-status-filter";
import { NewGoalDialog } from "@/components/goals/new-goal-dialog";
import { GOAL_CATEGORY_META, GOAL_CATEGORY_ORDER } from "@/components/goals/constants";
import type { GoalStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const { status } = await searchParams;
  const currentStatus: GoalStatus = (["ACTIVE", "COMPLETED", "ABANDONED"] as const).includes(
    status as GoalStatus
  )
    ? (status as GoalStatus)
    : "ACTIVE";

  const allGoals = await listGoals(workspace.id);
  const goals = allGoals
    .filter((g) => g.status === currentStatus)
    .map((g) => ({ ...g, progress: computeGoalProgress(g) }));

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Goals"
        description="Personal, financial, fitness, career, and learning goals in one place."
        actions={<NewGoalDialog />}
      />

      <div className="flex flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <GoalStatusFilter current={currentStatus} />

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title={allGoals.length === 0 ? "No goals yet" : "Nothing here"}
            description={
              allGoals.length === 0
                ? "Set your first goal — personal, financial, fitness, career, or learning."
                : "No goals with this status yet."
            }
            action={allGoals.length === 0 ? <NewGoalDialog /> : undefined}
          />
        ) : (
          GOAL_CATEGORY_ORDER.map((category) => {
            const inCategory = goals.filter((g) => g.category === category);
            if (inCategory.length === 0) return null;
            const meta = GOAL_CATEGORY_META[category];
            return (
              <div key={category} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <meta.icon className="size-4 text-[var(--muted-foreground)]" />
                  <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">{meta.label}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inCategory.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
