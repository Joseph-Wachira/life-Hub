"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { GoalStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setGoalStatusAction, deleteGoalAction } from "@/lib/actions/goals";
import { GOAL_STATUS_META, GOAL_STATUS_ORDER } from "./constants";

export function GoalStatusActions({ goalId, status }: { goalId: string; status: GoalStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleSetStatus(next: GoalStatus) {
    startTransition(async () => {
      const result = await setGoalStatusAction(goalId, next);
      if (result && "error" in result) toast.error(result.error);
      else toast.success(`Marked as ${GOAL_STATUS_META[next].label.toLowerCase()}`);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this goal? Milestones will be deleted too.")) return;
    startTransition(() => {
      deleteGoalAction(goalId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            {GOAL_STATUS_META[status].label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {GOAL_STATUS_ORDER.filter((s) => s !== status).map((s) => (
            <DropdownMenuItem key={s} onSelect={() => handleSetStatus(s)}>
              Mark as {GOAL_STATUS_META[s].label.toLowerCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon" className="text-[var(--danger)]" onClick={handleDelete} aria-label="Delete goal">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
