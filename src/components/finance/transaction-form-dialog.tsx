"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import type { TransactionType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createTransactionAction, updateTransactionAction } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/auth";
import { CategorySelect, type CategoryOption } from "./category-select";

export type TransactionRecord = {
  id: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string | null;
  description: string | null;
  occurredAt: string | Date;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionRecord | null;
  categories: CategoryOption[];
}) {
  const isEdit = Boolean(transaction);
  const action = isEdit ? updateTransactionAction : createTransactionAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE");
  const [categoryId, setCategoryId] = useState<string>(transaction?.categoryId ?? "none");
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (open) {
      setType(transaction?.type ?? "EXPENSE");
      setCategoryId(transaction?.categoryId ?? "none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  const defaultDate = transaction
    ? format(new Date(transaction.occurredAt), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const defaultAmount = transaction ? (transaction.amountCents / 100).toFixed(2) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Track money coming in or going out of this workspace.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={transaction!.id} />}

          <div className="grid grid-cols-2 gap-2">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setType(t);
                  setCategoryId("none");
                }}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium transition-colors",
                  type === t
                    ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
                aria-pressed={type === t}
              >
                {t === "EXPENSE" ? "Expense" : "Income"}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="txn-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">
                $
              </span>
              <Input
                id="txn-amount"
                name="amount"
                inputMode="decimal"
                defaultValue={defaultAmount}
                placeholder="0.00"
                className="pl-6"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <CategorySelect
              name="categoryId"
              type={type}
              categories={localCategories}
              value={categoryId}
              onChange={setCategoryId}
              onCategoryCreated={(c) => setLocalCategories((prev) => [...prev, c])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="txn-desc">Description</Label>
            <Input
              id="txn-desc"
              name="description"
              defaultValue={transaction?.description ?? ""}
              placeholder="Optional note"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="txn-date">Date</Label>
            <Input id="txn-date" name="occurredAt" type="date" defaultValue={defaultDate} required />
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Add transaction"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
