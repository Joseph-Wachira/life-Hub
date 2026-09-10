"use client";

import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteRecurringBillAction } from "@/lib/actions/finance";
import { BillFormDialog, type BillRecord } from "./bill-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import type { CategoryOption } from "./category-select";

interface BillRow extends BillRecord {
  category: { name: string; color: string } | null;
}

const FREQUENCY_LABEL: Record<string, string> = { WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

export function BillsList({ bills, categories }: { bills: BillRow[]; categories: CategoryOption[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BillRow | null>(null);
  const [deleting, setDeleting] = useState<BillRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> New bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={Receipt} title="No recurring bills yet" description="Add rent, subscriptions, or insurance to get reminders before they're due." />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
          {bills.map((bill) => {
            const daysUntilDue = differenceInCalendarDays(new Date(bill.nextDueDate), new Date());
            const dueSoon = daysUntilDue <= bill.reminderDaysBefore;
            return (
              <div key={bill.id} className="group flex items-center gap-3 bg-[var(--surface)] px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{bill.name}</span>
                    {bill.autoPay && <Badge variant="secondary">Autopay</Badge>}
                    {dueSoon && (
                      <Badge variant={daysUntilDue < 0 ? "danger" : "warning"}>
                        {daysUntilDue < 0 ? "Overdue" : daysUntilDue === 0 ? "Due today" : `Due in ${daysUntilDue}d`}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-[var(--subtle-foreground)]">
                    {FREQUENCY_LABEL[bill.frequency]} · Next {formatDate(bill.nextDueDate)}
                    {bill.category && ` · ${bill.category.name}`}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatCurrency(bill.amountCents)}</span>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      setEditing(bill);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-[var(--danger)]" onClick={() => setDeleting(bill)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BillFormDialog open={dialogOpen} onOpenChange={setDialogOpen} bill={editing} categories={categories} />
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete bill?"
        description={deleting ? `"${deleting.name}" will no longer be tracked.` : undefined}
        onConfirm={() => deleteRecurringBillAction(deleting!.id)}
        successMessage="Bill deleted"
      />
    </div>
  );
}
