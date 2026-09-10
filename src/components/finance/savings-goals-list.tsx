"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, PlusCircle, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, clamp } from "@/lib/utils";
import { deleteSavingsGoalAction } from "@/lib/actions/finance";
import { SavingsGoalFormDialog, type SavingsGoalRecord } from "./savings-goal-form-dialog";
import { ContributeDialog } from "./contribute-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

interface SavingsGoalRow extends SavingsGoalRecord {
  currentAmountCents: number;
}

export function SavingsGoalsList({ goals }: { goals: SavingsGoalRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoalRow | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoalRow | null>(null);
  const [contributing, setContributing] = useState<SavingsGoalRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> New savings goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No savings goals yet" description="Set a target — an emergency fund, a trip, a big purchase — and track your progress." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = g.targetAmountCents > 0 ? clamp(Math.round((g.currentAmountCents / g.targetAmountCents) * 100), 0, 100) : 0;
            return (
              <div key={g.id} className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="font-medium">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditing(g);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-[var(--danger)]" onClick={() => setDeleting(g)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress value={pct} />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatCurrency(g.currentAmountCents)}</span>
                  <span className="text-[var(--subtle-foreground)]">of {formatCurrency(g.targetAmountCents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  {g.targetDate ? (
                    <span className="text-xs text-[var(--subtle-foreground)]">Target {formatDate(g.targetDate)}</span>
                  ) : (
                    <span />
                  )}
                  <Button variant="outline" size="sm" onClick={() => setContributing(g)}>
                    <PlusCircle className="size-3.5" /> Contribute
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SavingsGoalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
      <ContributeDialog
        open={!!contributing}
        onOpenChange={(open) => !open && setContributing(null)}
        goalId={contributing?.id ?? null}
        goalName={contributing?.name}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete savings goal?"
        description={deleting ? `"${deleting.name}" will be permanently removed.` : undefined}
        onConfirm={() => deleteSavingsGoalAction(deleting!.id)}
        successMessage="Savings goal deleted"
      />
    </div>
  );
}
