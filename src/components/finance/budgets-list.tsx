"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, clamp } from "@/lib/utils";
import { deleteBudgetAction } from "@/lib/actions/finance";
import { BudgetFormDialog, type BudgetRecord } from "./budget-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import type { CategoryOption } from "./category-select";

interface BudgetRow extends BudgetRecord {
  category: { name: string; color: string };
  spentCents: number;
}

export function BudgetsList({
  budgets,
  expenseCategories,
}: {
  budgets: BudgetRow[];
  expenseCategories: CategoryOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const [deleting, setDeleting] = useState<BudgetRow | null>(null);

  if (expenseCategories.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Add an expense category first"
        description="Budgets are set per category — head to Categories to add one, then come back here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> New budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets yet"
          description="Set a monthly limit for a category to start tracking your spending against it."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {budgets.map((b) => {
            const pct = b.monthlyLimitCents > 0 ? clamp(Math.round((b.spentCents / b.monthlyLimitCents) * 100), 0, 999) : 0;
            const over = b.spentCents > b.monthlyLimitCents;
            return (
              <div key={b.id} className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.category.color }} />
                    <span className="font-medium">{b.category.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditing(b);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-[var(--danger)]" onClick={() => setDeleting(b)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress value={Math.min(pct, 100)} indicatorClassName={over ? "bg-[var(--danger)]" : pct > 80 ? "bg-[var(--warning)]" : undefined} />
                <div className="flex items-center justify-between text-sm">
                  <span className={over ? "font-medium text-[var(--danger)]" : "text-[var(--muted-foreground)]"}>
                    {formatCurrency(b.spentCents)} spent
                  </span>
                  <span className="text-[var(--subtle-foreground)]">of {formatCurrency(b.monthlyLimitCents)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budget={editing}
        expenseCategories={expenseCategories}
        usedCategoryIds={budgets.map((b) => b.categoryId)}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete budget?"
        description={deleting ? `The budget for "${deleting.category.name}" will be removed.` : undefined}
        onConfirm={() => deleteBudgetAction(deleting!.id)}
        successMessage="Budget deleted"
      />
    </div>
  );
}
